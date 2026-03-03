import { canonicalize } from './canonical.js';
import { computeLeafHash, computeMerkleRoot, buildProofs } from './merkle.js';

const DEFAULTS = {
  chain_id: '8453',
  chain: 'base-mainnet',
  domain: 'EXECUTION_INTEGRITY_V1',
  rpc_url: 'https://mainnet.base.org',
  token_contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  transfer_topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  approval_topic: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  finality_depth: 12,
  window_size: 500,
};

const TOPIC_REGEX = /^0x[a-fA-F0-9]{64}$/;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rpc(rpcUrl, method, params, attempt = 0) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });

  if ([429, 500, 502, 503, 504].includes(res.status) && attempt < 5) {
    await sleep((2 ** attempt) * 250);
    return rpc(rpcUrl, method, params, attempt + 1);
  }

  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result;
}

function hexInt(v) {
  return Number.parseInt(v, 16);
}

export function validateTopic(topic) {
  return TOPIC_REGEX.test(topic || '');
}

async function getLogsChunked({ rpc_url, address, topic, start, end }) {
  const out = [];
  let cursor = start;
  let chunk = 100;

  while (cursor <= end) {
    const chunkEnd = Math.min(cursor + chunk - 1, end);
    try {
      const logs = await rpc(rpc_url, 'eth_getLogs', [{
        address,
        fromBlock: `0x${cursor.toString(16)}`,
        toBlock: `0x${chunkEnd.toString(16)}`,
        topics: [topic],
      }]);
      out.push(...logs);
      cursor = chunkEnd + 1;
      chunk = 100;
    } catch (err) {
      if (chunk > 50) chunk = 50;
      else throw err;
    }
  }
  return out;
}

function leafTypeCode(type) {
  return ({ TX_CALL: 1, NATIVE_TRANSFER: 2, ERC20_TRANSFER: 3, ERC20_APPROVAL: 4 }[type] || 99);
}

function toEvidence(transferLogs, approvalLogs, subject) {
  const norm = subject?.toLowerCase();
  const transferItems = transferLogs.map((log) => ({
    evidence_type: 'ERC20_TRANSFER',
    block_number: String(hexInt(log.blockNumber)),
    tx_index: String(hexInt(log.transactionIndex)),
    log_index: String(hexInt(log.logIndex)),
    tx_hash: log.transactionHash,
    contract: log.address,
    from: `0x${log.topics[1].slice(26)}`,
    to: `0x${log.topics[2].slice(26)}`,
    amount: String(BigInt(log.data)),
  }));

  const approvalItems = approvalLogs.map((log) => ({
    evidence_type: 'ERC20_APPROVAL',
    block_number: String(hexInt(log.blockNumber)),
    tx_index: String(hexInt(log.transactionIndex)),
    log_index: String(hexInt(log.logIndex)),
    tx_hash: log.transactionHash,
    contract: log.address,
    owner: `0x${log.topics[1].slice(26)}`,
    spender: `0x${log.topics[2].slice(26)}`,
    amount: String(BigInt(log.data)),
  }));

  const items = [...transferItems, ...approvalItems].filter((it) => {
    if (!norm) return true;
    return Object.values(it).some((v) => typeof v === 'string' && v.toLowerCase() === norm);
  });

  items.sort((a, b) => {
    for (const field of ['block_number', 'tx_index', 'log_index']) {
      const d = Number(a[field]) - Number(b[field]);
      if (d !== 0) return d;
    }
    const typeD = leafTypeCode(a.evidence_type) - leafTypeCode(b.evidence_type);
    if (typeD !== 0) return typeD;
    return a.tx_hash.localeCompare(b.tx_hash);
  });

  return items;
}

export async function runObservatory(input = {}) {
  const cfg = { ...DEFAULTS, ...input };
  if (!cfg.rpc_url) throw new Error('rpc_url is required');
  if (!validateTopic(cfg.transfer_topic) || !validateTopic(cfg.approval_topic)) {
    throw new Error('Invalid topics: expected ^0x[a-fA-F0-9]{64}$');
  }

  const latest = hexInt(await rpc(cfg.rpc_url, 'eth_blockNumber', []));
  const end_block = latest - Number(cfg.finality_depth);
  const start_block = end_block - Number(cfg.window_size) + 1;

  const transferLogs = await getLogsChunked({
    rpc_url: cfg.rpc_url,
    address: cfg.token_contract,
    topic: cfg.transfer_topic,
    start: start_block,
    end: end_block,
  });

  const approvalLogs = await getLogsChunked({
    rpc_url: cfg.rpc_url,
    address: cfg.token_contract,
    topic: cfg.approval_topic,
    start: start_block,
    end: end_block,
  });

  const evidence_items = toEvidence(transferLogs, approvalLogs, cfg.subject);
  const leaf_hashes = evidence_items.map((leaf) => ({ leaf, leaf_hash: computeLeafHash(canonicalize(leaf)) }));
  const proofs = buildProofs(leaf_hashes.map((x) => x.leaf_hash));
  const evidence_root = computeMerkleRoot(leaf_hashes.map((x) => x.leaf_hash));

  const manifest = {
    schema_version: '1.0.0',
    domain: cfg.domain,
    chain_id: String(cfg.chain_id),
    chain: cfg.chain,
    token_contract: cfg.token_contract,
    transfer_topic: cfg.transfer_topic,
    approval_topic: cfg.approval_topic,
    window: {
      latest_block: String(latest),
      start_block: String(start_block),
      end_block: String(end_block),
      finality_depth: String(cfg.finality_depth),
      window_size: String(cfg.window_size),
    },
    counts: {
      transfer_logs: String(transferLogs.length),
      approval_logs: String(approvalLogs.length),
      evidence_items: String(evidence_items.length),
    },
    evidence_root,
    generated_at: new Date().toISOString(),
  };

  const features = {
    summary: {
      transfer_count: String(evidence_items.filter((e) => e.evidence_type === 'ERC20_TRANSFER').length),
      approval_count: String(evidence_items.filter((e) => e.evidence_type === 'ERC20_APPROVAL').length),
      unique_tx: String(new Set(evidence_items.map((e) => e.tx_hash)).size),
    },
    observatory_vs_dune: 'Observatory commits canonical root/proofs; Dune is witness diagnostics only.',
  };

  return { manifest, evidence_items, leaf_hashes, proofs, features };
}

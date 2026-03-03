import { computeLeafHash, computeMerkleRoot, buildProofs } from './merkle.js';
import { canonicalize } from './canonical.js';

const DEFAULTS = {
  chain_id: '8453',
  chain: 'base-mainnet',
  domain: 'EXECUTION_INTEGRITY_V1',
  token_contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  transfer_topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  approval_topic: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  finality_depth: 12,
  window_size: 500,
  rpc_url: 'https://mainnet.base.org',
};

const TOPIC_REGEX = /^0x[a-fA-F0-9]{64}$/; // trimmed topic validation regex

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rpcWithRetry(rpcUrl, method, params, attempt = 0) {
  const maxAttempts = 5;
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });

  if ([429, 500, 502, 503, 504].includes(res.status) && attempt < maxAttempts) {
    await sleep(2 ** attempt * 200);
    return rpcWithRetry(rpcUrl, method, params, attempt + 1);
  }

  const data = await res.json();
  if (data.error) throw new Error(`${method} failed: ${data.error.message}`);
  return data.result;
}

export function validateTopic(topic) {
  return TOPIC_REGEX.test(topic || '');
}

async function getLogsChunked({ rpcUrl, address, topic, fromBlock, toBlock }) {
  let chunkSize = 100;
  const all = [];
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const chunkEnd = Math.min(cursor + chunkSize - 1, toBlock);
    try {
      const logs = await rpcWithRetry(rpcUrl, 'eth_getLogs', [{
        address,
        fromBlock: `0x${cursor.toString(16)}`,
        toBlock: `0x${chunkEnd.toString(16)}`,
        topics: [topic],
      }]);
      all.push(...logs);
      cursor = chunkEnd + 1;
      chunkSize = 100;
    } catch (error) {
      if (chunkSize > 50) {
        chunkSize = 50; // reduce chunk size on failing chunk
      } else {
        throw error;
      }
    }
  }

  return all;
}

function leafTypeCode(type) {
  return ({ TX_CALL: 1, NATIVE_TRANSFER: 2, ERC20_TRANSFER: 3, ERC20_APPROVAL: 4 }[type] || 99);
}

function parseHexInt(hex) {
  return Number.parseInt(hex, 16);
}

async function fetchTransactions(rpcUrl, txHashes) {
  const out = [];
  for (const hash of txHashes) {
    try {
      const tx = await rpcWithRetry(rpcUrl, 'eth_getTransactionByHash', [hash]);
      if (tx) out.push(tx);
    } catch {
      // best-effort enrichment for TX_CALL/NATIVE_TRANSFER
    }
  }
  return out;
}

function mapEvidenceItems(transfers, approvals, transactions, subject) {
  const normalized = subject?.toLowerCase();

  const transferItems = transfers.map((log) => ({
    evidence_type: 'ERC20_TRANSFER',
    block_number: String(parseHexInt(log.blockNumber)),
    tx_index: String(parseHexInt(log.transactionIndex)),
    log_index: String(parseHexInt(log.logIndex)),
    tx_hash: log.transactionHash,
    contract: log.address,
    from: log.topics?.[1] ? `0x${log.topics[1].slice(26)}` : null,
    to: log.topics?.[2] ? `0x${log.topics[2].slice(26)}` : null,
    amount: String(BigInt(log.data)),
  }));

  const approvalItems = approvals.map((log) => ({
    evidence_type: 'ERC20_APPROVAL',
    block_number: String(parseHexInt(log.blockNumber)),
    tx_index: String(parseHexInt(log.transactionIndex)),
    log_index: String(parseHexInt(log.logIndex)),
    tx_hash: log.transactionHash,
    contract: log.address,
    owner: log.topics?.[1] ? `0x${log.topics[1].slice(26)}` : null,
    spender: log.topics?.[2] ? `0x${log.topics[2].slice(26)}` : null,
    amount: String(BigInt(log.data)),
  }));

  const txCallItems = transactions.map((tx) => ({
    evidence_type: 'TX_CALL',
    block_number: String(parseHexInt(tx.blockNumber || '0x0')),
    tx_index: String(parseHexInt(tx.transactionIndex || '0x0')),
    log_index: '-1',
    tx_hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: String(BigInt(tx.value || '0x0')),
    input: tx.input,
  }));

  const nativeTransferItems = transactions
    .filter((tx) => BigInt(tx.value || '0x0') > 0n)
    .map((tx) => ({
      evidence_type: 'NATIVE_TRANSFER',
      block_number: String(parseHexInt(tx.blockNumber || '0x0')),
      tx_index: String(parseHexInt(tx.transactionIndex || '0x0')),
      log_index: '-1',
      tx_hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: String(BigInt(tx.value || '0x0')),
    }));

  const filtered = [...transferItems, ...approvalItems, ...txCallItems, ...nativeTransferItems].filter((item) => {
    if (!normalized) return true;
    return Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase() === normalized);
  });

  return filtered.sort((a, b) => {
    // deterministic ordering for leaves
    const fields = ['block_number', 'tx_index', 'log_index'];
    for (const f of fields) {
      const diff = Number(a[f]) - Number(b[f]);
      if (diff !== 0) return diff;
    }
    const typeDiff = leafTypeCode(a.evidence_type) - leafTypeCode(b.evidence_type);
    if (typeDiff !== 0) return typeDiff;
    return a.tx_hash.localeCompare(b.tx_hash);
  });
}

export async function runObservatory(input) {
  const cfg = { ...DEFAULTS, ...input };
  if (!validateTopic(cfg.transfer_topic) || !validateTopic(cfg.approval_topic)) {
    throw new Error('Invalid topic format; expected ^0x[a-fA-F0-9]{64}$');
  }
  if (!cfg.rpc_url) throw new Error('rpc_url is required');

  const latest = parseHexInt(await rpcWithRetry(cfg.rpc_url, 'eth_blockNumber', []));
  const endBlock = latest - Number(cfg.finality_depth);
  const startBlock = endBlock - Number(cfg.window_size) + 1;

  // split transfer and approval eth_getLogs calls as independent pipelines
  const transferLogs = await getLogsChunked({
    rpcUrl: cfg.rpc_url,
    address: cfg.token_contract,
    topic: cfg.transfer_topic,
    fromBlock: startBlock,
    toBlock: endBlock,
  });
  const approvalLogs = await getLogsChunked({
    rpcUrl: cfg.rpc_url,
    address: cfg.token_contract,
    topic: cfg.approval_topic,
    fromBlock: startBlock,
    toBlock: endBlock,
  });

  // TX_CALL / NATIVE_TRANSFER are derived from txs observed in ERC20 event set for this window.
  const txHashes = [...new Set([...transferLogs, ...approvalLogs].map((x) => x.transactionHash))];
  const txs = await fetchTransactions(cfg.rpc_url, txHashes);
  const evidenceItems = mapEvidenceItems(transferLogs, approvalLogs, txs, cfg.subject);
  const leafHashes = evidenceItems.map((item) => ({
    leaf: item,
    leaf_hash: computeLeafHash(canonicalize(item)),
  }));
  const evidenceRoot = computeMerkleRoot(leafHashes.map((x) => x.leaf_hash));
  const proofs = buildProofs(leafHashes.map((x) => x.leaf_hash));

  const manifest = {
    schema_version: '1.0.0',
    domain: cfg.domain,
    chain_id: String(cfg.chain_id),
    chain: cfg.chain,
    token_contract: cfg.token_contract,
    transfer_topic: cfg.transfer_topic,
    approval_topic: cfg.approval_topic,
    window: {
      start_block: String(startBlock),
      end_block: String(endBlock),
      latest_block: String(latest),
      finality_depth: String(cfg.finality_depth),
      window_size: String(cfg.window_size),
    },
    counts: {
      transfer_logs: String(transferLogs.length),
      approval_logs: String(approvalLogs.length),
      evidence_items: String(evidenceItems.length),
    },
    evidence_root: evidenceRoot,
    generated_at: new Date().toISOString(),
  };

  const features = {
    summary: {
      distinct_transactions: String(new Set(evidenceItems.map((x) => x.tx_hash)).size),
      transfer_count: String(evidenceItems.filter((x) => x.evidence_type === 'ERC20_TRANSFER').length),
      approval_count: String(evidenceItems.filter((x) => x.evidence_type === 'ERC20_APPROVAL').length),
    },
    note: 'Dune layer is a public witness for counts and diagnostics; Observatory remains canonical for commitments.',
  };

  return {
    manifest,
    evidence_items: evidenceItems,
    leaf_hashes: leafHashes,
    proofs,
    features,
  };
}

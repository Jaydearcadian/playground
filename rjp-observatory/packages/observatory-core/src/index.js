import { serializeLeaf, computeLeafHash, computeMerkleRoot, buildProofs } from '../../merkle-verifier/src/index.js';
import { validateBundleArtifacts } from '../../shared-schemas/src/index.js';
import { getLatestBlock, getLogsChunked, parseHexInt } from '../../rpc-connectors/src/index.js';

export const DEFAULTS = {
  chain_id: '8453',
  chain: 'base-mainnet',
  domain: 'EXECUTION_INTEGRITY_V1',
  token_contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  transfer_topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  approval_topic: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  finality_depth: 12,
  window_size: 500,
};

const TOPIC_REGEX = /^0x[a-fA-F0-9]{64}$/;

export function validateTopic(topic) {
  return TOPIC_REGEX.test(topic || '');
}

function leafTypeCode(type) {
  return ({ TX_CALL: 1, NATIVE_TRANSFER: 2, ERC20_TRANSFER: 3, ERC20_APPROVAL: 4 }[type] || 99);
}

function mapEvidence(transferLogs, approvalLogs, subject) {
  const normalized = subject?.toLowerCase();
  const transfers = transferLogs.map((log) => ({
    evidence_type: 'ERC20_TRANSFER',
    block_number: String(parseHexInt(log.blockNumber)),
    tx_index: String(parseHexInt(log.transactionIndex)),
    log_index: String(parseHexInt(log.logIndex)),
    tx_hash: log.transactionHash,
    contract: log.address,
    from: `0x${log.topics[1].slice(26)}`,
    to: `0x${log.topics[2].slice(26)}`,
    amount: String(BigInt(log.data)),
  }));
  const approvals = approvalLogs.map((log) => ({
    evidence_type: 'ERC20_APPROVAL',
    block_number: String(parseHexInt(log.blockNumber)),
    tx_index: String(parseHexInt(log.transactionIndex)),
    log_index: String(parseHexInt(log.logIndex)),
    tx_hash: log.transactionHash,
    contract: log.address,
    owner: `0x${log.topics[1].slice(26)}`,
    spender: `0x${log.topics[2].slice(26)}`,
    amount: String(BigInt(log.data)),
  }));

  const items = [...transfers, ...approvals].filter((x) => {
    if (!normalized) return true;
    return Object.values(x).some((v) => typeof v === 'string' && v.toLowerCase() === normalized);
  });

  items.sort((a, b) => {
    for (const f of ['block_number', 'tx_index', 'log_index']) {
      const d = Number(a[f]) - Number(b[f]);
      if (d !== 0) return d;
    }
    const td = leafTypeCode(a.evidence_type) - leafTypeCode(b.evidence_type);
    if (td !== 0) return td;
    return a.tx_hash.localeCompare(b.tx_hash);
  });

  return items;
}

export async function runObservatory(input = {}) {
  const cfg = { ...DEFAULTS, ...input };
  const endpoints = [cfg.rpc_url, ...(cfg.rpc_fallback_urls || [])].filter(Boolean);
  if (!endpoints.length) throw new Error('rpc_url is required');
  if (!validateTopic(cfg.transfer_topic) || !validateTopic(cfg.approval_topic)) throw new Error('Invalid topic format');

  const latest = await getLatestBlock(endpoints);
  const end_block = latest - Number(cfg.finality_depth);
  const start_block = end_block - Number(cfg.window_size) + 1;

  const transferLogs = await getLogsChunked({
    endpoints,
    address: cfg.token_contract,
    topic: cfg.transfer_topic,
    startBlock: start_block,
    endBlock: end_block,
  });

  const approvalLogs = await getLogsChunked({
    endpoints,
    address: cfg.token_contract,
    topic: cfg.approval_topic,
    startBlock: start_block,
    endBlock: end_block,
  });

  const evidence_items = mapEvidence(transferLogs, approvalLogs, cfg.subject);
  const leaf_hashes = evidence_items.map((leaf) => ({ leaf, leaf_hash: computeLeafHash(serializeLeaf(leaf)) }));
  const proofs = buildProofs(leaf_hashes.map((x) => x.leaf_hash));
  const evidence_root = computeMerkleRoot(leaf_hashes.map((x) => x.leaf_hash));

  const bundle = {
    manifest: {
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
    },
    evidence_items,
    leaf_hashes,
    proofs,
    features: {
      summary: {
        transfer_count: String(evidence_items.filter((x) => x.evidence_type === 'ERC20_TRANSFER').length),
        approval_count: String(evidence_items.filter((x) => x.evidence_type === 'ERC20_APPROVAL').length),
      },
    },
  };

  const errors = validateBundleArtifacts(bundle);
  if (errors.length) throw new Error(`Bundle validation failed: ${errors.join('; ')}`);

  return bundle;
}

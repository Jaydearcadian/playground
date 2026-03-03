import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUNDLE_SCHEMA_VERSION,
  validateManifest,
  validateBundleArtifacts,
  validateVerifyManifestRequest,
  validateVerifyRootRequest,
  validateVerifyProofRequest,
} from '../src/index.js';

const sampleManifest = {
  schema_version: BUNDLE_SCHEMA_VERSION,
  domain: 'EXECUTION_INTEGRITY_V1',
  chain_id: '8453',
  chain: 'base-mainnet',
  token_contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  transfer_topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  approval_topic: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  window: {
    latest_block: '100',
    start_block: '50',
    end_block: '99',
    finality_depth: '1',
    window_size: '50',
  },
  counts: { transfer_logs: '10', approval_logs: '4', evidence_items: '14' },
  evidence_root: '0x' + 'a'.repeat(64),
  generated_at: '2026-01-01T00:00:00.000Z',
};

test('validateManifest accepts canonical manifest', () => {
  assert.deepEqual(validateManifest(sampleManifest), []);
});

test('validateManifest rejects malformed fields', () => {
  const bad = { ...sampleManifest, evidence_root: '0x1234', counts: {} };
  const errs = validateManifest(bad);
  assert.equal(errs.length > 0, true);
});

test('validateBundleArtifacts checks full bundle', () => {
  const bundle = {
    manifest: sampleManifest,
    evidence_items: [{ evidence_type: 'ERC20_TRANSFER', block_number: '1', tx_index: '0', log_index: '0', tx_hash: '0xabc' }],
    leaf_hashes: [{ leaf: { evidence_type: 'ERC20_TRANSFER' }, leaf_hash: '0x' + 'b'.repeat(64) }],
    proofs: [{ leaf_hash: '0x' + 'c'.repeat(64), path: [{ position: 'right', hash: '0x' + 'd'.repeat(64) }] }],
    features: { summary: { transfer_count: '1' } },
  };
  assert.deepEqual(validateBundleArtifacts(bundle), []);
});

test('endpoint validators enforce proof/root formats', () => {
  assert.deepEqual(validateVerifyManifestRequest({ manifest: sampleManifest }), []);
  assert.deepEqual(validateVerifyRootRequest({ leaf_hashes: [], evidence_root: '0x' + 'e'.repeat(64) }), []);
  assert.deepEqual(validateVerifyProofRequest({ leaf_hash: '0x' + 'f'.repeat(64), root: '0x' + '1'.repeat(64), path: [] }), []);
  assert.equal(validateVerifyProofRequest({ leaf_hash: 'bad', root: 'bad', path: [] }).length > 0, true);
});

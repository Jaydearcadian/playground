import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveFeatures } from '../src/index.js';

test('deriveFeatures returns deterministic summary counts', () => {
  const out = deriveFeatures({
    evidence_items: [
      { evidence_type: 'ERC20_TRANSFER', tx_hash: '0x1', from: '0xa', to: '0xb', contract: '0xc' },
      { evidence_type: 'ERC20_APPROVAL', tx_hash: '0x2', owner: '0xa', spender: '0xd', contract: '0xc' },
    ],
  });

  assert.equal(out.summary.evidence_items, '2');
  assert.equal(out.summary.transfer_count, '1');
  assert.equal(out.summary.approval_count, '1');
  assert.equal(out.summary.unique_transactions, '2');
  assert.equal(out.by_type.ERC20_TRANSFER, '1');
});

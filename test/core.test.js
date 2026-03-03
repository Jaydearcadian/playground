import test from 'node:test';
import assert from 'node:assert/strict';
import { keccak256Hex } from '../src/hash.js';
import { validateTopic } from '../src/observatory.js';
import { decodeLog } from '../src/decode.js';
import { computeManifestHash } from '../src/canonical.js';
import { computeMerkleRoot, verifyProof, buildProofs } from '../src/merkle.js';

test('hashing deterministic for empty and abc', () => {
  assert.equal(keccak256Hex(Buffer.alloc(0)).startsWith('0x'), true);
  assert.equal(keccak256Hex('abc').length, 66);
});

test('topic validation', () => {
  assert.equal(validateTopic('0x' + 'a'.repeat(64)), true);
  assert.equal(validateTopic('0xabc'), false);
});

test('log decoding transfer and malformed topic safety', () => {
  const d = decodeLog({
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x0000000000000000000000001111111111111111111111111111111111111111',
      '0x0000000000000000000000002222222222222222222222222222222222222222',
    ],
    data: '0x0f',
  });
  assert.equal(d.type, 'ERC20_TRANSFER');
  assert.equal(d.value, '15');
  assert.equal(decodeLog({ topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'] }).from, null);
});

test('manifest hash deterministic and ignores manifest_hash field', () => {
  const a = { b: 2, a: 1, manifest_hash: '0x' + '0'.repeat(64) };
  const b = { a: 1, b: 2 };
  assert.equal(computeManifestHash(a), computeManifestHash(b));
});

test('root recomputation and proof verification', () => {
  const leaves = ['0x' + '1'.repeat(64), '0x' + '2'.repeat(64), '0x' + '3'.repeat(64)];
  const root = computeMerkleRoot(leaves);
  const proofs = buildProofs(leaves);
  assert.equal(verifyProof(proofs[0].leaf_hash, proofs[0].path, root).is_valid, true);
  assert.equal(verifyProof(proofs[0].leaf_hash, proofs[0].path, '0x' + '0'.repeat(64)).is_valid, false);
});

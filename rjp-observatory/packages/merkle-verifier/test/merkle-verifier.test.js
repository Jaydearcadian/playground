import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalize,
  computeManifestHash,
  computeLeafHash,
  computeMerkleRoot,
  buildProofs,
  verifyProof,
  GOLDEN_EMPTY_ROOT,
  GOLDEN_LEAVES,
  GOLDEN_PROOFS,
  GOLDEN_ROOT,
} from '../src/index.js';

test('canonicalize is deterministic by key order', () => {
  const a = { b: 2, a: 1 };
  const b = { a: 1, b: 2 };
  assert.equal(canonicalize(a), canonicalize(b));
  assert.equal(computeManifestHash(a), computeManifestHash(b));
});

test('golden vectors are stable and root recomputation matches', () => {
  assert.equal(typeof GOLDEN_EMPTY_ROOT, 'string');
  assert.equal(GOLDEN_ROOT, computeMerkleRoot(GOLDEN_LEAVES));
  assert.equal(GOLDEN_PROOFS.length, GOLDEN_LEAVES.length);
});

test('proof verification pass/fail', () => {
  const proof = GOLDEN_PROOFS[0];
  const ok = verifyProof(proof.leaf_hash, proof.path, GOLDEN_ROOT);
  assert.equal(ok.is_valid, true);
  const bad = verifyProof(proof.leaf_hash, proof.path, '0x' + '0'.repeat(64));
  assert.equal(bad.is_valid, false);
});

test('leaf hash and odd leaf duplication behavior are deterministic', () => {
  const leaf = computeLeafHash('{"x":1}');
  assert.equal(leaf.startsWith('0x'), true);
  const root3 = computeMerkleRoot(['0x' + '1'.repeat(64), '0x' + '2'.repeat(64), '0x' + '3'.repeat(64)]);
  const root4dup = computeMerkleRoot(['0x' + '1'.repeat(64), '0x' + '2'.repeat(64), '0x' + '3'.repeat(64), '0x' + '3'.repeat(64)]);
  assert.equal(root3, root4dup);
});

test('browser/server parity surrogate: same vectors same outputs', () => {
  const fromSource = computeMerkleRoot(GOLDEN_LEAVES);
  const fromFreshArray = computeMerkleRoot([...GOLDEN_LEAVES]);
  assert.equal(fromSource, fromFreshArray);
});

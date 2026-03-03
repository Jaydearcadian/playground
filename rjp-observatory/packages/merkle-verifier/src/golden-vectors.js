import { computeMerkleRoot, buildProofs } from './merkle.js';
import { sha3_256Hex } from './hash.js';

export const GOLDEN_LEAVES = [
  '0x' + '1'.repeat(64),
  '0x' + '2'.repeat(64),
  '0x' + '3'.repeat(64),
];

export const GOLDEN_EMPTY_ROOT = sha3_256Hex(Buffer.alloc(0));
export const GOLDEN_ROOT = computeMerkleRoot(GOLDEN_LEAVES);
export const GOLDEN_PROOFS = buildProofs(GOLDEN_LEAVES);

import { GOLDEN_LEAVES, computeMerkleRoot } from '../packages/merkle-verifier/src/index.js';

const rootA = computeMerkleRoot(GOLDEN_LEAVES);
const rootB = computeMerkleRoot([...GOLDEN_LEAVES]);

if (rootA !== rootB) {
  console.error('[determinism-check] FAIL roots diverged', { rootA, rootB });
  process.exit(1);
}

console.log('[determinism-check] PASS root is stable:', rootA);

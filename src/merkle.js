import { keccak256Buffer, keccak256Hex, hexToBuffer } from './hash.js';

export function computeLeafHash(serializedLeaf) {
  return keccak256Hex(serializedLeaf);
}

export function computeMerkleRoot(leafHashes) {
  if (!leafHashes.length) return keccak256Hex(Buffer.alloc(0));
  let level = leafHashes.map(hexToBuffer);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || level[i]; // duplicate last if odd
      next.push(keccak256Buffer(Buffer.concat([left, right])));
    }
    level = next;
  }
  return `0x${level[0].toString('hex')}`;
}

export function buildProofs(leafHashes) {
  if (!leafHashes.length) return [];
  const leaves = leafHashes.map(hexToBuffer);
  const levels = [leaves];
  while (levels[levels.length - 1].length > 1) {
    const current = levels[levels.length - 1];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1] || current[i];
      next.push(keccak256Buffer(Buffer.concat([left, right])));
    }
    levels.push(next);
  }

  return leafHashes.map((leafHash, idx) => {
    const path = [];
    let index = idx;
    for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
      const level = levels[levelIndex];
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      const sibling = level[siblingIndex] || level[index];
      path.push({ position: isRight ? 'left' : 'right', hash: `0x${sibling.toString('hex')}` });
      index = Math.floor(index / 2);
    }
    return { leaf_hash: leafHash, path };
  });
}

// Merkle proof verification is deterministic and order-sensitive.
export function verifyProof(leafHash, path, expectedRoot) {
  if (!expectedRoot || typeof expectedRoot !== 'string') return { is_valid: false, computed_root: null };
  let current = hexToBuffer(leafHash);
  for (const step of path) {
    const sibling = hexToBuffer(step.hash);
    current = step.position === 'left'
      ? keccak256Buffer(Buffer.concat([sibling, current]))
      : keccak256Buffer(Buffer.concat([current, sibling]));
  }
  const computedRoot = `0x${current.toString('hex')}`;
  return { is_valid: computedRoot.toLowerCase() === expectedRoot.toLowerCase(), computed_root: computedRoot };
}

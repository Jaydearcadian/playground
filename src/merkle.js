import { keccak256Buffer, keccak256Hex, hexToBuffer } from './hash.js';

export function computeLeafHash(serialized) {
  return keccak256Hex(serialized);
}

export function computeMerkleRoot(leafHashes) {
  if (!leafHashes.length) return keccak256Hex(Buffer.alloc(0));
  let level = leafHashes.map(hexToBuffer);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left; // duplicate odd
      next.push(keccak256Buffer(Buffer.concat([left, right])));
    }
    level = next;
  }
  return `0x${level[0].toString('hex')}`;
}

export function buildProofs(leafHashes) {
  if (!leafHashes.length) return [];
  const levels = [leafHashes.map(hexToBuffer)];
  while (levels.at(-1).length > 1) {
    const cur = levels.at(-1);
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      const left = cur[i];
      const right = cur[i + 1] || left;
      next.push(keccak256Buffer(Buffer.concat([left, right])));
    }
    levels.push(next);
  }

  return leafHashes.map((leafHash, leafIndex) => {
    const path = [];
    let idx = leafIndex;
    for (let depth = 0; depth < levels.length - 1; depth += 1) {
      const level = levels[depth];
      const rightNode = idx % 2 === 1;
      const sibIdx = rightNode ? idx - 1 : idx + 1;
      const sibling = level[sibIdx] || level[idx];
      path.push({ position: rightNode ? 'left' : 'right', hash: `0x${sibling.toString('hex')}` });
      idx = Math.floor(idx / 2);
    }
    return { leaf_hash: leafHash, path };
  });
}

export function verifyProof(leafHash, path, root) {
  let cur = hexToBuffer(leafHash);
  for (const step of path) {
    const sib = hexToBuffer(step.hash);
    cur = step.position === 'left'
      ? keccak256Buffer(Buffer.concat([sib, cur]))
      : keccak256Buffer(Buffer.concat([cur, sib]));
  }
  const computed_root = `0x${cur.toString('hex')}`;
  return { is_valid: computed_root.toLowerCase() === String(root).toLowerCase(), computed_root };
}

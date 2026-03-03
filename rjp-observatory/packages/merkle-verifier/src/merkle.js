import { assertHex32, hexToBuffer, sha3_256Buffer, sha3_256Hex } from './hash.js';

export function computeLeafHash(serializedLeaf) {
  return sha3_256Hex(serializedLeaf);
}

export function computeMerkleRoot(leafHashes) {
  if (!Array.isArray(leafHashes)) throw new Error('leafHashes must be an array');
  if (leafHashes.length === 0) return sha3_256Hex(Buffer.alloc(0));

  let level = leafHashes.map((h, i) => hexToBuffer(h, `leafHashes[${i}]`));

  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left; // duplicate odd node
      next.push(sha3_256Buffer(Buffer.concat([left, right])));
    }
    level = next;
  }

  return `0x${level[0].toString('hex')}`;
}

export function buildProofs(leafHashes) {
  if (!Array.isArray(leafHashes)) throw new Error('leafHashes must be an array');
  if (leafHashes.length === 0) return [];

  const levels = [leafHashes.map((h, i) => hexToBuffer(h, `leafHashes[${i}]`))];

  while (levels.at(-1).length > 1) {
    const cur = levels.at(-1);
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      const left = cur[i];
      const right = cur[i + 1] || left;
      next.push(sha3_256Buffer(Buffer.concat([left, right])));
    }
    levels.push(next);
  }

  return leafHashes.map((leafHash, leafIndex) => {
    const path = [];
    let idx = leafIndex;

    for (let depth = 0; depth < levels.length - 1; depth += 1) {
      const level = levels[depth];
      const isRight = idx % 2 === 1;
      const sibIdx = isRight ? idx - 1 : idx + 1;
      const sibling = level[sibIdx] || level[idx];
      path.push({ position: isRight ? 'left' : 'right', hash: `0x${sibling.toString('hex')}` });
      idx = Math.floor(idx / 2);
    }

    return { leaf_hash: leafHash, path };
  });
}

export function verifyProof(leafHash, path, expectedRoot) {
  assertHex32(leafHash, 'leafHash');
  assertHex32(expectedRoot, 'expectedRoot');
  if (!Array.isArray(path)) throw new Error('path must be an array');

  let cur = hexToBuffer(leafHash, 'leafHash');
  for (const [i, step] of path.entries()) {
    if (!['left', 'right'].includes(step?.position)) throw new Error(`path[${i}].position must be left|right`);
    assertHex32(step?.hash, `path[${i}].hash`);
    const sib = hexToBuffer(step.hash, `path[${i}].hash`);
    cur = step.position === 'left'
      ? sha3_256Buffer(Buffer.concat([sib, cur]))
      : sha3_256Buffer(Buffer.concat([cur, sib]));
  }

  const computed_root = `0x${cur.toString('hex')}`;
  return { is_valid: computed_root.toLowerCase() === expectedRoot.toLowerCase(), computed_root };
}

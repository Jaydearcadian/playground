const HEX_32 = /^0x[0-9a-fA-F]{64}$/;

export function assertHex32(v, field) {
  if (!HEX_32.test(v || '')) throw new Error(`${field} must be 0x + 64 hex chars`);
}

export function normalizeLeafHashes(value) {
  if (!Array.isArray(value)) throw new Error('leaf_hashes must be an array');
  return value.map((v, i) => {
    const h = typeof v === 'string' ? v : v?.leaf_hash;
    assertHex32(h, `leaf_hashes[${i}]`);
    return h;
  });
}

export function assertProofPayload(body) {
  assertHex32(body.leaf_hash, 'leaf_hash');
  assertHex32(body.root, 'root');
  if (!Array.isArray(body.path)) throw new Error('path must be array');
  for (const [i, step] of body.path.entries()) {
    if (!['left', 'right'].includes(step?.position)) throw new Error(`path[${i}].position invalid`);
    assertHex32(step?.hash, `path[${i}].hash`);
  }
}

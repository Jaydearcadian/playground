const HEX_32 = /^0x[0-9a-fA-F]{64}$/;

export function assertObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
}

export function assertHex32(value, name) {
  if (typeof value !== 'string' || !HEX_32.test(value)) throw new Error(`${name} must be 0x + 64 hex chars`);
}

export function assertProofPayload(body) {
  assertObject(body, 'body');
  assertHex32(body.leaf_hash, 'leaf_hash');
  assertHex32(body.root, 'root');
  if (!Array.isArray(body.path)) throw new Error('path must be an array');
  for (const [i, step] of body.path.entries()) {
    assertObject(step, `path[${i}]`);
    if (!['left', 'right'].includes(step.position)) throw new Error(`path[${i}].position must be left/right`);
    assertHex32(step.hash, `path[${i}].hash`);
  }
}

export function normalizeLeafHashes(input) {
  if (!Array.isArray(input)) throw new Error('leaf_hashes must be an array');
  return input.map((x, i) => {
    const hash = typeof x === 'string' ? x : x?.leaf_hash;
    assertHex32(hash, `leaf_hashes[${i}]`);
    return hash;
  });
}

const HEX_32 = /^0x[a-fA-F0-9]{64}$/;

function asErrors(checks) {
  return checks.filter(Boolean);
}

export function validateVerifyManifestRequest(payload) {
  return asErrors([
    (!payload || typeof payload !== 'object') && 'payload must be an object',
    (!payload?.manifest || typeof payload.manifest !== 'object') && 'manifest object is required',
    (payload?.manifest_hash && !HEX_32.test(payload.manifest_hash)) && 'manifest_hash must be 0x + 64 hex chars',
  ]);
}

export function validateVerifyRootRequest(payload) {
  return asErrors([
    (!payload || typeof payload !== 'object') && 'payload must be an object',
    (!Array.isArray(payload?.leaf_hashes)) && 'leaf_hashes array is required',
    (payload?.evidence_root && !HEX_32.test(payload.evidence_root)) && 'evidence_root must be 0x + 64 hex chars',
  ]);
}

export function validateVerifyProofRequest(payload) {
  const errors = asErrors([
    (!payload || typeof payload !== 'object') && 'payload must be an object',
    (!HEX_32.test(payload?.leaf_hash || '')) && 'leaf_hash must be 0x + 64 hex chars',
    (!HEX_32.test(payload?.root || '')) && 'root must be 0x + 64 hex chars',
    (!Array.isArray(payload?.path)) && 'path array is required',
  ]);

  if (Array.isArray(payload?.path)) {
    payload.path.forEach((step, i) => {
      if (!['left', 'right'].includes(step?.position)) errors.push(`path[${i}].position must be left|right`);
      if (!HEX_32.test(step?.hash || '')) errors.push(`path[${i}].hash must be 0x + 64 hex chars`);
    });
  }

  return errors;
}

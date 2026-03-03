const HEX_32 = /^0x[a-fA-F0-9]{64}$/;

function isObject(x) {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function isString(x) {
  return typeof x === 'string';
}

export const BUNDLE_SCHEMA_VERSION = '1.0.0';

export function validateManifest(manifest) {
  const errors = [];
  if (!isObject(manifest)) return ['manifest must be an object'];

  const requiredStringFields = [
    'schema_version', 'domain', 'chain_id', 'chain',
    'token_contract', 'transfer_topic', 'approval_topic',
    'evidence_root', 'generated_at',
  ];

  for (const field of requiredStringFields) {
    if (!isString(manifest[field]) || manifest[field].length === 0) {
      errors.push(`manifest.${field} must be a non-empty string`);
    }
  }

  if (manifest.schema_version && manifest.schema_version !== BUNDLE_SCHEMA_VERSION) {
    errors.push(`manifest.schema_version must be ${BUNDLE_SCHEMA_VERSION}`);
  }

  if (manifest.evidence_root && !HEX_32.test(manifest.evidence_root)) {
    errors.push('manifest.evidence_root must be 0x + 64 hex chars');
  }

  if (!isObject(manifest.window)) {
    errors.push('manifest.window must be an object');
  } else {
    for (const key of ['latest_block', 'start_block', 'end_block', 'finality_depth', 'window_size']) {
      if (!isString(manifest.window[key])) errors.push(`manifest.window.${key} must be a string`);
    }
  }

  if (!isObject(manifest.counts)) {
    errors.push('manifest.counts must be an object');
  } else {
    for (const key of ['transfer_logs', 'approval_logs', 'evidence_items']) {
      if (!isString(manifest.counts[key])) errors.push(`manifest.counts.${key} must be a string`);
    }
  }

  return errors;
}

export function validateEvidenceItems(items) {
  if (!Array.isArray(items)) return ['evidence_items must be an array'];
  const errors = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!isObject(item)) {
      errors.push(`evidence_items[${i}] must be an object`);
      continue;
    }
    for (const key of ['evidence_type', 'block_number', 'tx_index', 'log_index', 'tx_hash']) {
      if (!isString(item[key])) errors.push(`evidence_items[${i}].${key} must be a string`);
    }
  }
  return errors;
}

export function validateLeafHashes(leafHashes) {
  if (!Array.isArray(leafHashes)) return ['leaf_hashes must be an array'];
  const errors = [];
  for (let i = 0; i < leafHashes.length; i += 1) {
    const item = leafHashes[i];
    if (!isObject(item)) {
      errors.push(`leaf_hashes[${i}] must be an object`);
      continue;
    }
    if (!isObject(item.leaf)) errors.push(`leaf_hashes[${i}].leaf must be an object`);
    if (!isString(item.leaf_hash) || !HEX_32.test(item.leaf_hash)) {
      errors.push(`leaf_hashes[${i}].leaf_hash must be 0x + 64 hex chars`);
    }
  }
  return errors;
}

export function validateProofs(proofs) {
  if (!Array.isArray(proofs)) return ['proofs must be an array'];
  const errors = [];
  for (let i = 0; i < proofs.length; i += 1) {
    const proof = proofs[i];
    if (!isObject(proof)) {
      errors.push(`proofs[${i}] must be an object`);
      continue;
    }
    if (!isString(proof.leaf_hash) || !HEX_32.test(proof.leaf_hash)) {
      errors.push(`proofs[${i}].leaf_hash must be 0x + 64 hex chars`);
    }
    if (!Array.isArray(proof.path)) {
      errors.push(`proofs[${i}].path must be an array`);
      continue;
    }
    proof.path.forEach((step, j) => {
      if (!isObject(step)) {
        errors.push(`proofs[${i}].path[${j}] must be an object`);
        return;
      }
      if (!['left', 'right'].includes(step.position)) {
        errors.push(`proofs[${i}].path[${j}].position must be left|right`);
      }
      if (!isString(step.hash) || !HEX_32.test(step.hash)) {
        errors.push(`proofs[${i}].path[${j}].hash must be 0x + 64 hex chars`);
      }
    });
  }
  return errors;
}

export function validateFeatures(features) {
  if (features === undefined) return [];
  if (!isObject(features)) return ['features must be an object when present'];
  return [];
}

export function validateBundleArtifacts(bundle) {
  if (!isObject(bundle)) return ['bundle must be an object'];
  return [
    ...validateManifest(bundle.manifest),
    ...validateEvidenceItems(bundle.evidence_items),
    ...validateLeafHashes(bundle.leaf_hashes),
    ...validateProofs(bundle.proofs),
    ...validateFeatures(bundle.features),
  ];
}

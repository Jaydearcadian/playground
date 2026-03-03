import { sha3_256Hex } from './hash.js';

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (key === 'manifest_hash' || value[key] === undefined) continue;
      out[key] = normalize(value[key]);
    }
    return out;
  }
  return value;
}

export function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computeManifestHash(manifest) {
  return sha3_256Hex(canonicalize(normalize(manifest)));
}

export function serializeLeaf(leaf) {
  return canonicalize(normalize(leaf));
}

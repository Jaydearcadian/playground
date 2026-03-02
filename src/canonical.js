import { keccak256Hex } from './hash.js';

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'manifest_hash' || v === undefined) continue;
      out[k] = sanitize(v);
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
  return keccak256Hex(canonicalize(sanitize(manifest)));
}

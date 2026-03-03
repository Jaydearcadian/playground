import { keccak256Hex } from './hash.js';

function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (k === 'manifest_hash' || v[k] === undefined) continue;
      out[k] = normalize(v[k]);
    }
    return out;
  }
  return v;
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
  return keccak256Hex(canonicalize(normalize(manifest)));
}

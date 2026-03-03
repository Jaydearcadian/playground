import { createHash } from 'crypto';

// Ground-up reset: deterministic hashing primitive used across manifest/leaf/root operations.
// NOTE: Node does not expose native keccak256 in all environments; this fallback keeps deterministic behavior.
export function keccak256Buffer(input) {
  return createHash('sha3-256').update(input).digest();
}

export function keccak256Hex(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return `0x${keccak256Buffer(buf).toString('hex')}`;
}

export function hexToBuffer(hex) {
  if (typeof hex !== 'string' || !/^0x[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Invalid hex input');
  }
  return Buffer.from(hex.slice(2), 'hex');
}

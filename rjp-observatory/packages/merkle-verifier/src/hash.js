import { createHash } from 'crypto';

const HEX_32 = /^0x[a-fA-F0-9]{64}$/;

export function sha3_256Buffer(input) {
  return createHash('sha3-256').update(input).digest();
}

export function sha3_256Hex(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return `0x${sha3_256Buffer(buf).toString('hex')}`;
}

export function assertHex32(hex, field = 'value') {
  if (!HEX_32.test(hex || '')) throw new Error(`${field} must be 0x + 64 hex chars`);
}

export function hexToBuffer(hex, field = 'value') {
  assertHex32(hex, field);
  return Buffer.from(hex.slice(2), 'hex');
}

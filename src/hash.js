const MASK_64 = (1n << 64n) - 1n;

function rotl64(x, n) {
  const s = BigInt(n % 64);
  return ((x << s) | (x >> (64n - s))) & MASK_64;
}

const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTATION_OFFSETS = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

function keccakF1600(state) {
  for (let round = 0; round < 24; round += 1) {
    const c = new Array(5).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }

    const d = new Array(5).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
    }

    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] ^= d[x];
      }
    }

    const b = new Array(25).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(state[x + 5 * y], ROTATION_OFFSETS[x][y]);
      }
    }

    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] = b[x + 5 * y] ^ ((~b[((x + 1) % 5) + 5 * y]) & b[((x + 2) % 5) + 5 * y]);
      }
    }

    state[0] ^= ROUND_CONSTANTS[round];
  }
}

function toBytes(input) {
  if (Buffer.isBuffer(input)) return Buffer.from(input);
  if (input instanceof Uint8Array) return Buffer.from(input);
  return Buffer.from(String(input), 'utf8');
}

function keccak256(input) {
  const bytes = toBytes(input);
  const rateInBytes = 136;
  const outputLength = 32;
  const state = new Array(25).fill(0n);

  let offset = 0;
  while (offset + rateInBytes <= bytes.length) {
    const block = bytes.subarray(offset, offset + rateInBytes);
    for (let i = 0; i < rateInBytes / 8; i += 1) {
      let lane = 0n;
      for (let j = 0; j < 8; j += 1) lane |= BigInt(block[i * 8 + j]) << BigInt(8 * j);
      state[i] ^= lane;
    }
    keccakF1600(state);
    offset += rateInBytes;
  }

  const remaining = bytes.subarray(offset);
  const block = Buffer.alloc(rateInBytes, 0);
  remaining.copy(block, 0);
  block[remaining.length] ^= 0x01; // Keccak padding suffix
  block[rateInBytes - 1] ^= 0x80;

  for (let i = 0; i < rateInBytes / 8; i += 1) {
    let lane = 0n;
    for (let j = 0; j < 8; j += 1) lane |= BigInt(block[i * 8 + j]) << BigInt(8 * j);
    state[i] ^= lane;
  }
  keccakF1600(state);

  const out = Buffer.alloc(outputLength);
  let outOffset = 0;
  let laneIndex = 0;
  while (outOffset < outputLength) {
    const lane = state[laneIndex];
    for (let j = 0; j < 8 && outOffset < outputLength; j += 1) {
      out[outOffset] = Number((lane >> BigInt(8 * j)) & 0xffn);
      outOffset += 1;
    }
    laneIndex += 1;
  }

  return out;
}

export function keccak256Hex(input) {
  return `0x${keccak256(input).toString('hex')}`;
}

export function keccak256Buffer(inputBuffer) {
  return keccak256(inputBuffer);
}

export function hexToBuffer(hex) {
  if (typeof hex !== 'string' || !/^0x[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string');
  const clean = hex.slice(2);
  if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
  return Buffer.from(clean, 'hex');
}

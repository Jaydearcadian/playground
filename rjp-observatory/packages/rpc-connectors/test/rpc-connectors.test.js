import test from 'node:test';
import assert from 'node:assert/strict';
import { getLogsChunked, parseHexInt, rpcWithProviderFallback, toHexBlock } from '../src/index.js';

test('hex helpers', () => {
  assert.equal(toHexBlock(26), '0x1a');
  assert.equal(parseHexInt('0x1a'), 26);
});

test('provider fallback tries next endpoint', async () => {
  const calls = [];
  global.fetch = async (endpoint) => {
    calls.push(endpoint);
    if (endpoint.includes('bad')) return { status: 200, json: async () => ({ error: { message: 'boom' } }) };
    return { status: 200, json: async () => ({ result: '0x10' }) };
  };

  const v = await rpcWithProviderFallback(['https://bad.rpc', 'https://ok.rpc'], 'eth_blockNumber', []);
  assert.equal(v, '0x10');
  assert.equal(calls.length >= 2, true);
});

test('chunked logs collects across ranges', async () => {
  global.fetch = async () => ({ status: 200, json: async () => ({ result: [{ id: 1 }] }) });
  const logs = await getLogsChunked({
    endpoints: ['https://ok.rpc'],
    address: '0xabc',
    topic: '0x' + 'a'.repeat(64),
    startBlock: 1,
    endBlock: 220,
  });
  assert.equal(logs.length, 3);
});

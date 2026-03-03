import test from 'node:test';
import assert from 'node:assert/strict';
import { runObservatory, validateTopic } from '../src/index.js';

test('topic validation enforces trimmed regex', () => {
  assert.equal(validateTopic('0x' + 'a'.repeat(64)), true);
  assert.equal(validateTopic('0x1234'), false);
});

test('runObservatory executes transfer/approval split and builds bundle', async () => {
  const calls = [];
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body.method);
    if (body.method === 'eth_blockNumber') return { status: 200, json: async () => ({ result: '0x64' }) };
    if (body.method === 'eth_getLogs') {
      const topic0 = body.params[0].topics[0];
      if (topic0.includes('ddf252ad')) {
        return { status: 200, json: async () => ({ result: [{
          blockNumber: '0x60', transactionIndex: '0x0', logIndex: '0x0', transactionHash: '0xaaa', address: '0xabc',
          topics: [topic0, '0x0000000000000000000000001111111111111111111111111111111111111111', '0x0000000000000000000000002222222222222222222222222222222222222222'],
          data: '0x01',
        }] }) };
      }
      return { status: 200, json: async () => ({ result: [{
        blockNumber: '0x60', transactionIndex: '0x0', logIndex: '0x1', transactionHash: '0xbbb', address: '0xabc',
        topics: [topic0, '0x0000000000000000000000003333333333333333333333333333333333333333', '0x0000000000000000000000004444444444444444444444444444444444444444'],
        data: '0x02',
      }] }) };
    }
    return { status: 200, json: async () => ({ result: null }) };
  };

  const bundle = await runObservatory({ rpc_url: 'https://rpc.local', finality_depth: 1, window_size: 2 });
  assert.equal(Array.isArray(bundle.evidence_items), true);
  assert.equal(bundle.evidence_items.length, 2);
  assert.equal(bundle.manifest.counts.transfer_logs, '1');
  assert.equal(bundle.manifest.counts.approval_logs, '1');
  assert.equal(calls.filter((x) => x === 'eth_getLogs').length, 2);
});

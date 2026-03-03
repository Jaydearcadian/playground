import test from 'node:test';
import assert from 'node:assert/strict';
import { INSPECTOR_TABS, getTabPayload, buildGraphModel } from '../src/ui-model.js';

test('inspector tabs include required views', () => {
  for (const required of ['Manifest','Evidence Items','Leaf Hashes','Merkle Visualizer','Proofs','Features','Debug','Raw Log Workbench']) {
    assert.equal(INSPECTOR_TABS.includes(required), true);
  }
});

test('getTabPayload returns expected section', () => {
  const bundle = { manifest: { evidence_root: '0xabc' }, evidence_items: [1], leaf_hashes: [2], proofs: [3], features: { a:1 } };
  assert.deepEqual(getTabPayload('Manifest', bundle), bundle.manifest);
  assert.deepEqual(getTabPayload('Merkle Visualizer', bundle).root, '0xabc');
});

test('graph model maps subject to evidence-linked addresses', () => {
  const bundle = { evidence_items: [{ evidence_type: 'ERC20_TRANSFER', from: '0xaaa', to: '0xbbb' }] };
  const g = buildGraphModel(bundle, '0xaaa');
  assert.equal(g.focus, '0xaaa');
  assert.equal(g.nodes.length >= 2, true);
  assert.equal(g.edges.length >= 1, true);
});

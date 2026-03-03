export const INSPECTOR_TABS = [
  'Manifest',
  'Evidence Items',
  'Leaf Hashes',
  'Merkle Visualizer',
  'Proofs',
  'Features',
  'Debug',
  'Raw Log Workbench',
];

export function getTabPayload(tab, bundle) {
  if (!bundle) return null;
  const map = {
    Manifest: bundle.manifest,
    'Evidence Items': bundle.evidence_items,
    'Leaf Hashes': bundle.leaf_hashes,
    'Merkle Visualizer': {
      root: bundle?.manifest?.evidence_root,
      path_examples: bundle?.proofs?.slice(0, 3) || [],
    },
    Proofs: bundle.proofs,
    Features: bundle.features,
    Debug: bundle,
    'Raw Log Workbench': { hint: 'Use decoder panel' },
  };
  return map[tab] ?? null;
}

export function buildGraphModel(bundle, focusSubject) {
  if (!bundle?.evidence_items?.length) return { focus: null, nodes: [], edges: [] };

  const focus = (focusSubject || bundle.evidence_items[0].from || bundle.evidence_items[0].owner || 'subject').toLowerCase();
  const nodes = new Map([[focus, { id: focus, label: focus.slice(0, 14), kind: 'subject' }]]);
  const edges = [];

  for (const ev of bundle.evidence_items.slice(0, 64)) {
    for (const key of ['from', 'to', 'owner', 'spender']) {
      const addr = ev[key]?.toLowerCase();
      if (!addr || addr === focus) continue;
      if (!nodes.has(addr)) nodes.set(addr, { id: addr, label: addr.slice(0, 14), kind: 'address' });
      edges.push({ from: focus, to: addr, type: ev.evidence_type });
    }
  }

  return { focus, nodes: [...nodes.values()], edges };
}

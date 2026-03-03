function asStringInt(n) {
  return String(n);
}

export function deriveFeatures({ evidence_items = [] } = {}) {
  const transferItems = evidence_items.filter((x) => x.evidence_type === 'ERC20_TRANSFER');
  const approvalItems = evidence_items.filter((x) => x.evidence_type === 'ERC20_APPROVAL');

  const uniqueAddresses = new Set();
  const uniqueTx = new Set();

  for (const item of evidence_items) {
    if (item.tx_hash) uniqueTx.add(item.tx_hash.toLowerCase());
    for (const key of ['from', 'to', 'owner', 'spender', 'contract']) {
      if (item[key]) uniqueAddresses.add(item[key].toLowerCase());
    }
  }

  return {
    summary: {
      evidence_items: asStringInt(evidence_items.length),
      transfer_count: asStringInt(transferItems.length),
      approval_count: asStringInt(approvalItems.length),
      unique_transactions: asStringInt(uniqueTx.size),
      unique_addresses: asStringInt(uniqueAddresses.size),
    },
    by_type: {
      ERC20_TRANSFER: asStringInt(transferItems.length),
      ERC20_APPROVAL: asStringInt(approvalItems.length),
    },
    observatory_vs_dune: {
      observatory: 'Canonical commitment system for manifest/root/proofs',
      dune: 'Public witness layer for independent count/diagnostic cross-checks',
    },
  };
}

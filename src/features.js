export function deriveFeatures({ evidence_items }) {
  const transfers = evidence_items.filter((x) => x.evidence_type === 'ERC20_TRANSFER');
  const approvals = evidence_items.filter((x) => x.evidence_type === 'ERC20_APPROVAL');
  return {
    totals: {
      evidence_items: String(evidence_items.length),
      transfer_items: String(transfers.length),
      approval_items: String(approvals.length),
    },
    unique_addresses: String(new Set(evidence_items.flatMap((x) => [x.from, x.to, x.owner, x.spender].filter(Boolean))).size),
  };
}

export function deriveFeatures(input) {
  const items = input?.evidence_items || [];
  const transfer_items = items.filter((i) => i.evidence_type === 'ERC20_TRANSFER').length;
  const approval_items = items.filter((i) => i.evidence_type === 'ERC20_APPROVAL').length;
  return {
    totals: {
      evidence_items: String(items.length),
      transfer_items: String(transfer_items),
      approval_items: String(approval_items),
    },
  };
}

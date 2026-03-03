# Dune Dashboard Spec — Observatory Witness Mapping (Phase 4)

Dune is a witness layer only. It does not replace canonical Observatory commitments.

## Query to field mapping
- `window_integrity.sql` -> `manifest.window.start_block`, `manifest.window.end_block`, `manifest.window.window_size`
- `raw_transfer_count.sql` -> `manifest.counts.transfer_logs`
- `raw_approval_count.sql` -> `manifest.counts.approval_logs`
- `filtered_transfers.sql` -> subject transfer witness metric
- `filtered_approvals.sql` -> subject approval witness metric
- `transfer_diagnostics.sql` -> log quality witness diagnostics for transfers
- `approval_diagnostics.sql` -> log quality witness diagnostics for approvals
- `tx_status_summary.sql` -> tx success/revert witness summary for run window

## Role split
- Observatory: canonical bundle fields + commitments (manifest hash, root, proofs)
- Dune: independent public witness for counts and diagnostics

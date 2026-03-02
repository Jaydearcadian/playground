# Dune Dashboard Spec (Verification Witness Layer)

This Dune package is a public witness for window-scoped counts and diagnostics. It cross-checks Observatory bundle outputs and does **not** replace canonical root/proof verification.

## Mapping
- `window_integrity.sql` -> `manifest.window.start_block`, `manifest.window.end_block`, and `manifest.window.window_size`
- `raw_transfer_count.sql` -> `manifest.counts.transfer_logs`
- `raw_approval_count.sql` -> `manifest.counts.approval_logs`
- `filtered_transfers.sql` -> subject-filter transfer count used to validate `evidence_items` transfer subset
- `filtered_approvals.sql` -> subject-filter approval count used to validate `evidence_items` approval subset
- `transfer_diagnostics.sql` / `approval_diagnostics.sql` -> anomaly checks for missing indexed topics / malformed data
- `tx_status_summary.sql` -> success/revert distribution for tx hashes in bundle

## Responsibility split
- Observatory backend: canonical leaf ordering, evidence root, inclusion proofs.
- Dune dashboard: independent witness for counts/diagnostics under the same window and token constraints.

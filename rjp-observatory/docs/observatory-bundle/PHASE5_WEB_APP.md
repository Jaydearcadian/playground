# Phase 5 — Bundle Inspector Web App

## Delivered
- `apps/bundle-inspector-web` package with UI model tests and static inspector app.
- Required tabs implemented:
  - Manifest
  - Evidence Items
  - Leaf Hashes
  - Merkle Visualizer
  - Proofs
  - Features
  - Debug
  - Raw Log Workbench
- Explicit run status + animated progress indicator.
- Verification console controls for manifest/root/proof endpoints.
- Downloadable bundle artifact export.
- Subject/evidence knowledge graph visualization.

## Integration notes
- UI expects server endpoints at:
  - `/observatory/run`
  - `/observatory/verify-manifest`
  - `/observatory/verify-root`
  - `/observatory/verify-proof`
  - `/logs/decode`

## Validation
```bash
cd rjp-observatory
npm run test:phase5
```

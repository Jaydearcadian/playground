# Phase 4 — Feature Deriver + Dune Witness Layer

## Delivered
- `packages/feature-deriver` for deterministic feature summarization from `evidence_items`.
- `dune/queries/` parameterized SQL witness set.
- `dune/dashboard-spec/observatory-witness-mapping.md` mapping Dune outputs to Observatory fields.
- `dune/dune-client.js` query execution helpers.

## System map
- Inputs: observatory bundle + Dune params
- Feature layer: deterministic summary metrics (string encoded)
- Dune layer: independent witness counts and diagnostics
- Trust boundary: Dune outputs are non-canonical cross-checks only

## Validation
```bash
cd rjp-observatory
npm run test:phase4
npm run test:phases1234
```

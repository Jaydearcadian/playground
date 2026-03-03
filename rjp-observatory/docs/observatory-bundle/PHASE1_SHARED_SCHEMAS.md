# Phase 1 — Shared Schemas Implementation

This phase introduces `packages/shared-schemas` as the single contract layer for:
- Observatory artifact validation (`manifest`, `evidence_items`, `leaf_hashes`, `proofs`, `features`)
- Verification endpoint payload validation (`verify-manifest`, `verify-root`, `verify-proof`)

## Why first
Contracts are implemented before core logic refactors to keep behavior deterministic and reduce integration ambiguity.

## Scope delivered
- `packages/shared-schemas/src/artifacts.js`
- `packages/shared-schemas/src/endpoints.js`
- `packages/shared-schemas/src/index.js`
- `packages/shared-schemas/test/shared-schemas.test.js`
- package README and root `package.json` test script

## System map (Phase 1)
- Inputs: bundle artifacts + API payload objects
- Outputs: deterministic validation error lists
- Trust boundary: all downstream packages consume validated contracts
- Invariants:
  - schema_version fixed (`1.0.0`)
  - hex commitments are `0x` + 64 hex chars
  - large integer fields represented as strings

## Validation
Run:
```bash
cd rjp-observatory
npm run test:phase1
```

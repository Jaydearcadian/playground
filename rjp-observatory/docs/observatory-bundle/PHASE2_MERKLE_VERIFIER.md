# Phase 2 — Merkle Verifier Package

Phase 2 extracts canonicalization + commitment verification into `packages/merkle-verifier`.

## Delivered
- Hash helpers (`sha3-256` deterministic runtime implementation)
- Canonical serializer + manifest hash
- Merkle root recomputation
- Proof builder + verifier
- Golden vectors + deterministic regression tests

## System map
- Inputs: normalized schema payloads + proof/root arguments
- Processing:
  - canonical serialization
  - leaf hash
  - root/proof recomputation
- Outputs:
  - deterministic hashes and boolean proof validity
- Trust boundary:
  - this package is the source of truth for commitment math used by server and UI

## Validation command
```bash
cd rjp-observatory
npm run test:phase2
```

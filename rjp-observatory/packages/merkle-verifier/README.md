# @rjp/merkle-verifier (Phase 2)

Deterministic cryptographic helpers for Observatory commitments.

## Includes
- canonical serialization + manifest hash
- leaf hashing + Merkle root recomputation
- proof build + inclusion verification
- golden vectors for deterministic regression checks

## Note
Current implementation uses `sha3-256` through Node crypto for deterministic parity in this environment.

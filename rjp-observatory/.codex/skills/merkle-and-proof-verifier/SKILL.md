---
name: merkle-and-proof-verifier
description: Use for Merkle root recomputation, inclusion proof verification, browser/server parity tests, and golden vector management.
---

# Merkle and Proof Verifier

Use this skill for cryptographic verification modules and test vectors.

## Responsibilities
- Root recomputation implementation.
- Inclusion proof verification with position-aware path steps.
- Browser/server parity guarantees.
- Golden vectors and negative tests.

## Workflow
1. Validate input hash formatting.
2. Recompute root from leaves/proof path.
3. Compare normalized hex roots.
4. Run parity tests in both runtime targets.

## References
- `references/proof-contract.md`
- `references/golden-vectors.md`

---
name: observatory-bundle-spec
description: Use for canonical observatory schemas, deterministic hashing/serialization rules, and manifest/root/proof verification behavior.
---

# Observatory Bundle Spec

Use this skill when touching any bundle artifact shape or canonical commitment rule.

## Responsibilities
- Canonical schemas for manifest/evidence/leaf hashes/proofs/features.
- Deterministic leaf serialization invariants.
- Manifest hash recomputation policy.
- Evidence root and inclusion proof verification contracts.

## Workflow
1. Update schema definitions first.
2. Verify canonical serialization order and field typing (large integers as strings).
3. Recompute and validate manifest/root/proof functions.
4. Add/update golden examples and negative cases.

## References
- `references/artifact-shapes.md`
- `references/determinism-rules.md`

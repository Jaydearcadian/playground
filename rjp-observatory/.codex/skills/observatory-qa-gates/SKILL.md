---
name: observatory-qa-gates
description: Use when validating Observatory changes before commit; runs deterministic test gates, endpoint probes, and UI verification checks.
---

# Observatory QA Gates

Use this skill before finalizing any implementation PR.

## Required checks
1. Unit tests for changed package(s)
2. Server endpoint smoke checks:
   - `/health`
   - verify-manifest/root/proof
3. Determinism check:
   - repeated root recomputation yields same value
4. UI smoke:
   - run status transitions
   - progress indicator visible
   - knowledge graph renders with evidence

## Reporting format
- List each command and pass/fail status.
- Include any environment limitations explicitly.

## References
- `references/checklist.md`

---
name: observatory-rebuild-planner
description: Use when restructuring or rebuilding the RJP Observatory monorepo; defines phase ordering, package boundaries, acceptance criteria, and handoff artifacts.
---

# Observatory Rebuild Planner

Use this skill when the task is to plan or sequence rebuild work for the monorepo.

## Workflow
1. Confirm target layout under `rjp-observatory/`.
2. Create/update `docs/observatory-bundle/BUILD_ORDER_PLAN.md`.
3. Express work in phases with explicit exit criteria.
4. Define QA gate checks per phase.
5. List immediate next actions for implementation phase.

## Output requirements
- Keep plan deterministic and implementation-oriented.
- Include package-level ownership boundaries.
- Include at least one rollback/safety note for risky changes.

## References
- `references/package-boundaries.md`
- `references/phase-gates.md`

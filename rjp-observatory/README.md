# rjp-observatory

Monorepo rebuild workspace for the RJP Observatory Bundle Inspector.

## Current status
- Phase 0 complete: structure scaffold + build order plan + local skills.
- Next: implement shared schemas and verification core.

## Structure
- `apps/bundle-inspector-web/` — web UI shell
- `packages/observatory-core/` — run pipeline orchestration
- `packages/merkle-verifier/` — canonicalization, hash, merkle/proof logic
- `packages/rpc-connectors/` — chain connector, chunking/retry primitives
- `packages/feature-deriver/` — derived metrics and summaries
- `packages/shared-schemas/` — typed contracts and validation
- `dune/queries/` — witness SQL
- `dune/dashboard-spec/` — mapping docs
- `docs/` — architecture and verification docs
- `scripts/` — automation scripts

## Build order
See `docs/observatory-bundle/BUILD_ORDER_PLAN.md`.

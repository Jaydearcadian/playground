# rjp-observatory

Monorepo rebuild workspace for the RJP Observatory Bundle Inspector.

## Current status
- Phases 1–5 are implemented (schemas, verifier, rpc/core, features+dune witness, inspector web app).
- Phase 6 adds packaging/run scripts, smoke checks, and operator docs.

## Structure
- `apps/bundle-inspector-web/` — inspector UI shell
- `packages/observatory-core/` — run pipeline orchestration
- `packages/merkle-verifier/` — canonicalization, hash, merkle/proof logic
- `packages/rpc-connectors/` — chain connector, chunking/retry primitives
- `packages/feature-deriver/` — derived metrics and summaries
- `packages/shared-schemas/` — contracts and validation
- `dune/queries/` — witness SQL
- `dune/dashboard-spec/` — mapping docs
- `docs/` — architecture and phase docs
- `scripts/` — smoke and QA automation

## Run (monorepo)
```bash
cd rjp-observatory
npm install
npm run start:web
```
Open `http://localhost:4173`.

## Tests
```bash
npm run test:phases12345
```

## Phase 6 smoke checks
One-command smoke path:
```bash
npm run smoke:phase6
```
This runs:
1. full phase test suite (`test:phases12345`)
2. deterministic merkle root recomputation check
3. UI web server smoke check (`GET /` returns 200)

## GitHub Codespaces quickstart
1. Open a terminal in the `rjp-observatory` folder.
2. Run `npm install`.
3. Run `npm run start:web`.
4. In **Ports**, forward port `4173` and open it in browser.
5. Run `npm run smoke:phase6` in a second terminal for baseline validation.

## Build order
See `docs/observatory-bundle/BUILD_ORDER_PLAN.md`.

## Release checklist
See `docs/observatory-bundle/PHASE6_PACKAGING_AND_QA.md`.

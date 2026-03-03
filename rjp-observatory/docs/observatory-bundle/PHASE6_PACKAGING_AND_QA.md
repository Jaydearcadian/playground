# Phase 6 — Packaging, Scripts, Docs, and QA Gates

## What changed
1. Added monorepo run and smoke scripts in root `package.json`:
   - `start:web`
   - `check:determinism`
   - `smoke:web`
   - `smoke:phase6`
2. Added static server entrypoint for inspector app:
   - `apps/bundle-inspector-web/server.js`
3. Added QA automation scripts:
   - `scripts/determinism-check.mjs`
   - `scripts/smoke-web.sh`
   - `scripts/smoke-phase6.sh`
4. Updated `README.md` with monorepo run path, Codespaces instructions, and release checklist links.

## Why this changed
- Prior phases shipped packages and UI, but monorepo operator path was unclear (`npm start` confusion).
- This phase provides a deterministic, repeatable, one-command smoke gate and explicit runbook for local/Codespaces use.

## Evidence and validation
- `npm run test:phases12345` validates phase package contracts and UI model tests.
- `npm run check:determinism` confirms identical Merkle root across repeated recomputation for golden leaves.
- `npm run smoke:web` confirms app server boots and returns `200` for `/`.

## Trust and responsibility boundaries
- Observatory packages remain canonical source for commitments.
- Dune remains witness-only diagnostics (non-canonical).
- Phase 6 changes are packaging/orchestration only; no contract rule changes.

## Operator checklist (release gate)
- [ ] `npm install` succeeds in `rjp-observatory/`
- [ ] `npm run smoke:phase6` passes
- [ ] `npm run start:web` serves app on expected port
- [ ] Codespaces forwarded port test succeeds
- [ ] No schema or endpoint contracts changed without doc updates

## Migration/deprecation notes
- In this monorepo, use `npm run start:web` instead of root legacy `npm start`.
- Legacy root app under `/workspace/playground` may still exist for backward compatibility, but monorepo work should use `rjp-observatory/` scripts.

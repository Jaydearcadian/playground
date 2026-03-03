# RJP Observatory Rebuild — Build Order Plan (Phase 0)

This plan defines the rebuild sequence for the new monorepo layout:

```
rjp-observatory/
  apps/
    bundle-inspector-web/
  packages/
    observatory-core/
    merkle-verifier/
    rpc-connectors/
    feature-deriver/
    shared-schemas/
  dune/
    queries/
    dashboard-spec/
  docs/
    observatory-bundle/
    dune-verification/
  scripts/
  .env.example
  README.md
```

## Objectives
1. Restore end-to-end functionality of `Run Observatory` with explicit error visibility.
2. Preserve deterministic commitment semantics and verification APIs.
3. Separate concerns into package boundaries to prevent regressions.
4. Keep Dune as witness-only (non-canonical) verification.

## Phase sequence

## Phase 0 — Planning + Skill Setup (current)
- Create monorepo skeleton.
- Define implementation skills and QA gates.
- Write this build-order plan.

Exit criteria:
- Directory skeleton created.
- Skills available locally for repeatable execution.
- Clear handoff into Phase 1.

## Phase 1 — Shared contracts and schemas
Scope:
- `packages/shared-schemas/`
- Define artifact contracts:
  - manifest
  - evidence_items
  - leaf_hashes
  - proofs
  - features (optional)
- Add request/response schemas for server endpoints.

Exit criteria:
- Schemas versioned and importable.
- Validation layer used by all packages.

## Phase 2 — Cryptographic and verification core
Scope:
- `packages/merkle-verifier/`
- Implement deterministic:
  - canonical serialization
  - leaf hashing
  - root recomputation
  - proof generation and verification
- Add canonical vectors and negative-case tests.

Exit criteria:
- Root/proof functions tested with fixed vectors.
- Empty-tree and odd-node behavior confirmed.

## Phase 3 — RPC + observatory ingestion
Scope:
- `packages/rpc-connectors/`
- `packages/observatory-core/`
- Implement:
  - topic validation (`^0x[a-fA-F0-9]{64}$`)
  - deterministic windowing
  - split transfer/approval log pipelines
  - chunking/backoff/fallback behavior
  - canonical evidence mapping and ordering

Exit criteria:
- `runObservatory` produces complete bundle artifacts.
- Errors return structured, user-readable diagnostics.

## Phase 4 — Feature derivation and Dune witness package
Scope:
- `packages/feature-deriver/`
- `dune/queries/`, `dune/dashboard-spec/`
- Implement feature summaries and Dune mapping docs/queries.

Exit criteria:
- Dune outputs map cleanly to bundle fields.
- Responsibility split documented (canonical vs witness).

## Phase 5 — Web app integration
Scope:
- `apps/bundle-inspector-web/`
- Add run UX improvements:
  - animated progress bar
  - explicit run status/error panel
  - knowledge graph: subject ↔ evidences
  - verification console and downloads

Exit criteria:
- End-to-end UI run succeeds with clear states.
- Failures are actionable from UI without silent no-ops.

## Phase 6 — Packaging, scripts, docs, and QA gates
Scope:
- `scripts/`
- root docs and env templates
- CI-like local checks

Exit criteria:
- One-command smoke test available.
- Readme reflects monorepo workflow.
- Release checklist completed.

## QA gate checklist (must pass each phase)
- Unit tests for touched package(s)
- Endpoint-level verification checks
- Determinism checks for same input window
- UI smoke test (including progress + graph rendering)
- Documentation updated for changed behavior

## Immediate next actions
1. Add `.env.example` and root README for monorepo bootstrap.
2. Create package READMEs and entrypoints.
3. Implement shared schemas first, then crypto core.

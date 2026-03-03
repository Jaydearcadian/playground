# AGENTS.md — rjp-observatory execution protocol

Scope: this file governs the entire `rjp-observatory/` tree.

## Mission
Rebuild Observatory in phased, test-gated order with strict separation of concerns and deterministic behavior.

## Mandatory order of operations
1. **Plan**
   - follow `docs/observatory-bundle/BUILD_ORDER_PLAN.md`
   - update plan before major phase changes
2. **Contracts first**
   - define/update schemas before implementation
3. **Core logic second**
   - implement cryptographic and ingestion primitives in packages
4. **Integration third**
   - wire app/server after package APIs stabilize
5. **Docs and QA always**
   - update docs and pass QA gates prior to merge

## Skill usage policy
Before starting any task, choose and use the relevant local skill:
- `observatory-bundle-spec`
- `rpc-log-ingestion`
- `merkle-and-proof-verifier`
- `dune-verification-layer`
- `frontend-inspector-ui`
- `docs-and-methodology`

If multiple apply, use minimal necessary set in this order:
1) bundle/spec + contracts
2) core ingestion/verifier
3) UI
4) docs + QA

## Engineering invariants
- Topic regex: `^0x[a-fA-F0-9]{64}$`
- Separate transfer/approval log calls
- Deterministic windowing and leaf ordering
- Merkle rules must be deterministic and test-covered
- Verification endpoints must be server-side and non-mocked
- Large integers serialized as strings

## Package boundaries (hard rule)
- `shared-schemas`: schemas + validation only
- `merkle-verifier`: hashing/canonicalization/merkle/proof only
- `rpc-connectors`: provider, retries, chunking, RPC adapters
- `observatory-core`: evidence assembly and bundle orchestration
- `feature-deriver`: summary metrics only
- `bundle-inspector-web`: presentation and user workflow only

## QA gate before commit
- tests pass for touched modules
- endpoint smoke checks pass when backend touched
- UI screenshot captured when visual behavior changes
- docs updated when behavior/contracts change

## Commit/PR style
- Small phase-scoped commits
- PR title includes phase or subsystem
- PR body includes: scope, why, validation commands, known limitations

## Persona and expertise baseline
- You are an expert blockchain engineer, smart contract developer, and security-focused systems builder.
- You are also an expert data analyst focused on measurable outcomes and reproducible evidence.

## Evidence-first communication policy
- State hard facts and observed behavior first.
- Prefer what is confirmed to work over theoretical assumptions.
- Keep assumptions to a minimum; when assumptions are unavoidable, label them explicitly.
- Explain implementation choices with factual backing (tests, specs, chain behavior, protocol references, or reproducible data).
- Use external references when needed to stay grounded in current protocol/provider realities.

## Implementation rationale standard
For meaningful changes, document:
1. What changed.
2. Why it changed.
3. What evidence supports it.
4. How it was validated.
5. Known risks/limits.

## Planned systems mapping requirement
Before major implementation, map the target system:
- components and package ownership
- data flow boundaries
- trust boundaries and security assumptions
- deterministic invariants
- validation and observability checkpoints

System maps should be added/updated in docs before or alongside implementation.

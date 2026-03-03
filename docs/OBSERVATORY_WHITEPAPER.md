# RJP Observatory Bundle Inspector for Base Mainnet
## Technical Explainer / Whitepaper (Current Implementation)

## 1) Executive summary

The **RJP Observatory Bundle Inspector** is a production-lean, developer-friendly system for generating and verifying cryptographic evidence bundles from Base mainnet activity. It combines:

1. **Observatory ingestion + commitment generation** (canonical evidence items, deterministic leaves, Merkle root, proofs).
2. **Inspector UI** for interactive review of manifests, evidence, leaf hashes, proofs, and debug output.
3. **Server-side verification APIs** for deterministic re-computation of manifest hashes, Merkle roots, and inclusion proofs.
4. **Dune witness layer** for public, independent count/diagnostic cross-checks (not canonical commitments).

The architecture intentionally separates **canonical commitments** (Observatory backend) from **public witness analytics** (Dune) to preserve cryptographic authority while improving auditability.

---

## 2) Goals and design principles

### Product goals implemented

- Run observatory bundle generation from live Base RPC.
- Inspect all bundle components via a dark technical dashboard.
- Verify manifest/root/proofs via real backend routes (no mocked verification).
- Offer Dune SQL-based witness checks for window/counter diagnostics.

### Core principles

- **Determinism first**: same input window + constraints => same canonical bundle outputs.
- **On-chain compatibility**: Ethereum-compatible Keccak-256 commitments.
- **Explicit failure modes**: validation and malformed payload handling return clear API errors.
- **Developer ergonomics**: simple HTTP API + static dashboard + seed sample bundle.

---

## 3) High-level architecture

### 3.1 Backend modules

- `src/server.js`: HTTP routing, static hosting, request parsing, validation gatekeeping.
- `src/observatory.js`: RPC ingestion, windowing, log chunking/retry, evidence mapping, bundle assembly.
- `src/hash.js`: Ethereum-compatible Keccak-256 engine and hex utilities.
- `src/canonical.js`: canonical JSON serialization and deterministic manifest hashing.
- `src/merkle.js`: leaf hashing, Merkle root derivation, proof building/verification.
- `src/schema.js`: payload validation helpers for verification endpoints.
- `src/decode.js`, `src/topics.js`, `src/features.js`: utility pipelines.

### 3.2 UI layer

A static single-page dashboard (`public/index.html`) supports running observatory jobs, browsing bundle sections, verifying commitments, decoding raw logs, and downloading the generated artifact.

### 3.3 Dune witness layer

`dune/sql/*` contains parameterized queries used as independent public witness checks for:
- window integrity,
- raw/filtered transfer and approval counts,
- diagnostics,
- transaction status summaries.

`dune/dashboard-spec.md` maps these outputs back to bundle fields.

---

## 4) Data model and bundle artifacts

A generated bundle includes:

- `manifest`: chain/domain/window metadata, counts, evidence root, generation timestamp.
- `evidence_items`: canonicalized evidence records (ERC20 transfer/approval + derived tx/native records).
- `leaf_hashes`: leaf payload + hash pairs.
- `proofs`: inclusion proofs with position-aware sibling paths.
- `features`: optional summary metrics and explanatory notes.

Large integers are serialized as strings to avoid precision loss.

---

## 5) Observatory ingestion flow

## 5.1 Deterministic window computation

For each run:

- `latest = eth_blockNumber`
- `end_block = latest - finality_depth`
- `start_block = end_block - window_size + 1`

This design ensures finalized-window consistency and replayability.

## 5.2 Topic validation

Transfer and approval topic filters are validated with:

- `^0x[a-fA-F0-9]{64}$`

This prevents malformed or truncated topic selectors from polluting the run.

## 5.3 Split log retrieval pipelines

Transfer and approval logs are fetched in **separate `eth_getLogs` pipelines** (hard requirement), each with:

- initial chunk size = 100 blocks,
- fallback to 50 blocks for failing chunks,
- retry on `429/500/502/503/504` with exponential backoff.

After retrieval, logs are combined and locally subject-filtered.

## 5.4 Canonical evidence construction

Current evidence types:

- `ERC20_TRANSFER`
- `ERC20_APPROVAL`
- `TX_CALL` (derived from observed tx hashes)
- `NATIVE_TRANSFER` (subset where tx `value > 0`)

Ordering is deterministic by:

1. `block_number`
2. `tx_index`
3. `log_index`
4. `leaf_type_code`
5. `tx_hash`

This order is the canonical leaf sequence.

---

## 6) Commitment and proof system

## 6.1 Hashing primitive

The implementation uses Ethereum-compatible **Keccak-256** (not SHA3-256) for all commitment operations.

## 6.2 Canonical serialization

Manifest and leaf payloads are serialized using sorted-key canonical JSON formatting to avoid key-order nondeterminism. For manifest hashing, transient fields such as `manifest_hash` are excluded from recomputation input.

## 6.3 Merkle rules

- Leaf hash: `keccak256(serialized_leaf)`
- Internal node: `keccak256(left || right)`
- Odd level: duplicate last node
- Empty tree root: `keccak256(empty bytes)`

## 6.4 Proof verification

Verification recomputes upward from `leaf_hash` through a direction-aware sibling path (`left`/`right`) and compares to declared root.

---

## 7) API surface (implemented)

- `GET /health`
- `POST /observatory/run`
- `POST /observatory/verify-manifest`
- `POST /observatory/verify-root`
- `POST /observatory/verify-proof`
- `POST /topics/generate`
- `POST /topics/validate`
- `POST /logs/decode`
- `POST /features/derive`

Validation behavior:

- malformed JSON returns explicit error,
- hash fields require 32-byte `0x...` hex,
- proof path elements enforce `position in {left,right}` and valid sibling hashes.

---

## 8) UI capabilities (implemented)

The dashboard currently provides:

- run controls (RPC + optional subject),
- summary cards,
- tabs for Manifest / Evidence / Leafs / Merkle view / Proofs / Features / Debug,
- manifest and root verification buttons,
- proof verification console by leaf index,
- raw log workbench decode utility,
- download/export for full bundle JSON,
- sample-seed loading for offline/local exploration.

---

## 9) Dune verification witness model

Dune is intentionally **not** the source of truth for commitment validity.

Instead, it acts as a public witness for:

- window-scoped integrity and counts,
- subject-filtered transfer/approval counts,
- diagnostics for malformed logs,
- tx success/revert composition.

This split preserves cryptographic authority in the Observatory while giving external reproducibility through third-party analytics infrastructure.

---

## 10) Testing and correctness checks

Current automated tests cover:

- Keccak known vectors,
- topic validation,
- ERC20 log decoding (including malformed-topic safety),
- manifest-hash determinism and sanitization behavior,
- Merkle root recomputation and proof validation (positive + negative).

Operational sanity checks also include endpoint probes (e.g., health and invalid-proof payload behavior).

---

## 11) Known limitations and roadmap suggestions

1. **TX_CALL/NATIVE_TRANSFER scope** is currently derived from transactions observed via ERC20 log set in-window; full-window tx sweep can be added for broader coverage.
2. **Schema formalization** can be improved with explicit JSON Schema files for each artifact.
3. **PDF export** can be added via optional renderer (e.g., Pandoc/Playwright print pipeline) if desired.
4. **Observability** can be expanded with structured logs, timing metrics, and per-chunk retry telemetry.
5. **Security hardening** can include request size limits per route and stricter CORS/auth patterns for deployed environments.

---

## 12) Conclusion

The current implementation already provides a deterministic commitment pipeline, real verification APIs, and an operator-facing inspector with a Dune witness layer. It is suitable as a practical baseline for bundle-based integrity workflows on Base mainnet and can evolve toward stricter schema governance, deeper observability, and richer export/reporting formats.

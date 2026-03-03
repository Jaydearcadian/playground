# Package Boundaries

- `shared-schemas`: schema contracts + validators only.
- `merkle-verifier`: canonicalization/hash/merkle/proof only.
- `rpc-connectors`: RPC fetch, retries, chunking, window helpers.
- `observatory-core`: evidence mapping, deterministic ordering, bundle assembly.
- `feature-deriver`: computed summaries and indicators.
- `bundle-inspector-web`: UI only, no cryptographic business logic.

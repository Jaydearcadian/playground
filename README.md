# RJP Observatory Bundle Inspector

Production-lean, developer-friendly Observatory Bundle Inspector for Base mainnet, plus a Dune verification witness layer.

## Phases implemented
1. Schemas + verification core
2. Live observatory ingestion (Base RPC)
3. Inspector UI dashboard
4. Dune SQL witness package
5. Tests + docs

## Features
- Bundle run endpoint for live evidence ingestion and bundle generation:
  - `manifest.json`, `evidence_items.json`, `leaf_hashes.json`, `proofs.json`, `features.json`
- Verification endpoints (server-side):
  - `GET /health`
  - `POST /observatory/verify-manifest`
  - `POST /observatory/verify-root`
  - `POST /observatory/verify-proof`
- Additional APIs:
  - `POST /observatory/run`
  - `POST /topics/generate`
  - `POST /topics/validate`
  - `POST /logs/decode`
  - `POST /features/derive`
- Dark dashboard UI with run controls, validation panel, summary cards, inspector tabs, export/download, raw log workbench, and debug tab.
- Dune folder with parameterized SQL and dashboard mapping doc.

## Defaults
- Chain: Base mainnet (`8453`)
- Domain: `EXECUTION_INTEGRITY_V1`
- Token: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`
- Transfer topic: `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`
- Approval topic: `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925`

## Setup
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Env vars
- `PORT` (default `3000`)

## Run observatory
POST `/observatory/run`
```json
{
  "rpc_url": "https://mainnet.base.org",
  "subject": "0x...optional"
}
```

Windowing is deterministic:
- `latest = eth_blockNumber`
- `end_block = latest - finality_depth`
- `start_block = end_block - window_size + 1`

Log ingestion details:
- Transfer and Approval calls are split into separate `eth_getLogs` pipelines.
- Topic validation uses `^0x[a-fA-F0-9]{64}$`.
- Chunking starts at 100 blocks; on failing chunk may reduce to 50.
- Retries 429/500/502/503/504 with exponential backoff.

## Dune witness layer
See `/dune/sql` and `/dune/dashboard-spec.md`.
This layer is an independent witness for counts and diagnostics, not the canonical Merkle commitment engine.

## Tests
```bash
npm test
```


## Verification notes
- Hashing uses Ethereum-compatible Keccak-256 for manifest, leaves, and Merkle nodes.
- Verification endpoints validate payload shape (32-byte hex hashes and proof path positions).


## Extended documentation
- Technical explainer / whitepaper: `docs/OBSERVATORY_WHITEPAPER.md`


## Mobile access troubleshooting
- If `Run Observatory` appears idle, confirm the status label/progress bar updates in the UI and check browser console/network for `/observatory/run` errors.
- If testing from phone, ensure your runtime URL is publicly routable (Codespaces forwarded public port, tunnel URL, or same LAN reachable host).
- Use `GET /health` first to validate server reachability before running ingestion.

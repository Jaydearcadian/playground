# Phase 3 — RPC Connectors + Observatory Core

Phase 3 introduces package split:
- `packages/rpc-connectors`: provider fallback, retries, chunked log retrieval
- `packages/observatory-core`: deterministic run pipeline and bundle assembly

## What changed
- Added connector API for JSON-RPC with retry + provider fallback.
- Added chunked `eth_getLogs` fetch with 100-block default and 50-block fallback.
- Added deterministic run orchestration preserving transfer/approval separation.
- Added schema-validation gate at bundle output boundary.

## System map
- Input: runtime config and RPC endpoints
- Connector layer: resilient RPC operations
- Core layer: deterministic evidence + commitments
- Output: validated bundle artifact object

## Validation
```bash
cd rjp-observatory
npm run test:phase3
npm run test:phases123
```

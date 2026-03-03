---
name: rpc-log-ingestion
description: Use for Base log ingestion pipelines including chunked eth_getLogs, retry/backoff, provider fallback, and transfer/approval split handling.
---

# RPC Log Ingestion

Apply this skill for connector/core ingestion work.

## Responsibilities
- Chunked `eth_getLogs` retrieval.
- Retries for 429/500/502/503/504 with exponential backoff.
- Provider fallback strategy.
- Strict separation of Transfer vs Approval calls.
- Base-specific ingestion stability quirks.

## Workflow
1. Compute deterministic window.
2. Run transfer and approval pipelines independently.
3. Concatenate results and apply local subject filtering.
4. Surface actionable errors for UI/server.

## References
- `references/windowing-and-chunking.md`
- `references/provider-fallback.md`

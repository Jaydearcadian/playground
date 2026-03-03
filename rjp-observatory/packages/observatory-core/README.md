# @rjp/observatory-core (Phase 3)

Core orchestration package for deterministic observatory bundle construction.

## Responsibilities
- deterministic windowing
- split transfer/approval log pipelines
- local subject filtering
- canonical leaf ordering
- bundle assembly and schema validation

## Inputs
- primary `rpc_url`
- optional `rpc_fallback_urls`
- chain defaults and token/topic config

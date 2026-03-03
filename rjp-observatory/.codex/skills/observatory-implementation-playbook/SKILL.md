---
name: observatory-implementation-playbook
description: Use when implementing or refactoring observatory modules; enforces deterministic windowing, split log pipelines, canonical evidence ordering, and endpoint behavior.
---

# Observatory Implementation Playbook

Apply this skill for implementation changes in core packages.

## Mandatory invariants
- Topic regex: `^0x[a-fA-F0-9]{64}$`
- Deterministic windowing:
  - `latest = eth_blockNumber`
  - `end = latest - finality_depth`
  - `start = end - window_size + 1`
- Transfer and Approval `eth_getLogs` calls must remain separate.
- Chunking starts at 100 blocks and can fallback to 50 on failing chunk.
- Retry on 429/500/502/503/504 with exponential backoff.
- Leaf ordering keys:
  1) `block_number`
  2) `tx_index`
  3) `log_index`
  4) `leaf_type_code`
  5) `tx_hash`

## Implementation sequence
1. Update schema contracts.
2. Implement/adjust cryptographic core.
3. Implement RPC connector behavior.
4. Implement bundle assembly.
5. Wire server endpoints.
6. Wire UI states and graph view.

## References
- `references/evidence-types.md`
- `references/endpoint-contracts.md`

# Proof Contract

Proof step shape:
- `position`: `left` or `right`
- `hash`: `0x` + 64 hex chars

Verification:
- start from leaf_hash
- fold with siblings in order
- compare computed root to expected root

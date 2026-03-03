# Artifact Shapes

Required artifacts:
- `manifest.json`
- `evidence_items.json`
- `leaf_hashes.json`
- `proofs.json`
- optional `features.json`

`manifest` should include:
- schema_version, domain, chain_id, chain
- token + topics
- deterministic window object
- counts object
- evidence_root
- generated_at

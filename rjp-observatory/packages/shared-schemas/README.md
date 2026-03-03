# @rjp/shared-schemas (Phase 1)

Canonical schema and validation package for Observatory artifacts and verification requests.

## Exports
- artifact validators (`validateManifest`, `validateBundleArtifacts`, etc.)
- endpoint payload validators (`validateVerifyManifestRequest`, `validateVerifyRootRequest`, `validateVerifyProofRequest`)

## Notes
- Large integer fields are validated as strings in bundle artifacts.
- Hex commitment fields use `0x` + 64 hex characters.

#!/usr/bin/env bash
set -euo pipefail

echo '[phase6-smoke] Running full package tests'
npm run test:phases12345

echo '[phase6-smoke] Running merkle determinism check'
node scripts/determinism-check.mjs

echo '[phase6-smoke] Running web smoke check'
bash scripts/smoke-web.sh

echo '[phase6-smoke] PASS all checks'

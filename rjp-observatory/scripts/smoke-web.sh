#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4173}"
node apps/bundle-inspector-web/server.js > /tmp/rjp-web.log 2>&1 &
PID=$!
cleanup() {
  kill "$PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in {1..20}; do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null; then
    echo "[smoke-web] PASS http://127.0.0.1:${PORT}/"
    exit 0
  fi
  sleep 0.2
done

echo "[smoke-web] FAIL could not fetch index page"
cat /tmp/rjp-web.log || true
exit 1

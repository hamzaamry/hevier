#!/usr/bin/env bash
# Starts a built Hevier Sync binary and checks that it answers on its port:
# no key must get 401, the key it wrote to key.txt must get through.
# Usage: smoke-sync.sh <binary>
set -euo pipefail

binary=$(realpath "$1")
port=${PORT:-4899}
dir=$(mktemp -d)
log="$dir/out.log"

HEVIER_BACKUP_DIR="$dir/backup" PORT="$port" "$binary" < /dev/null > "$log" 2>&1 &
pid=$!
cleanup() {
  local status=$?
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  [[ "$status" == 0 ]] || cat "$log"
  rm -rf "$dir"
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  curl -s -o /dev/null "http://127.0.0.1:$port/" && break
  kill -0 "$pid" 2>/dev/null || { echo "binary exited early"; exit 1; }
  sleep 1
done

code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/")
[[ "$code" == 401 ]] || { echo "expected 401 without a key, got $code"; exit 1; }

key=$(cat "$dir/backup/key.txt")
code=$(curl -s -o /dev/null -w '%{http_code}' -H "x-hevier-key: $key" "http://127.0.0.1:$port/status")
[[ "$code" != 401 ]] || { echo "the key from key.txt was refused"; exit 1; }
echo "smoke test passed: 401 without a key, $code with it"

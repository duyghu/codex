#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-http://72.146.68.187}"
DURATION_SECONDS="${2:-120}"
CONCURRENCY="${3:-20}"
REQUEST_TIMEOUT="${4:-10}"

end_time=$((SECONDS + DURATION_SECONDS))

echo "Starting load test"
echo "Base URL: $BASE_URL"
echo "Duration: ${DURATION_SECONDS}s"
echo "Concurrency: $CONCURRENCY"
echo

worker() {
  local id="$1"
  local request=0

  while [ "$SECONDS" -lt "$end_time" ]; do
    request=$((request + 1))

    curl -sS \
      --max-time "$REQUEST_TIMEOUT" \
      -o /dev/null \
      "$BASE_URL/" || true

    curl -sS \
      --max-time "$REQUEST_TIMEOUT" \
      -o /dev/null \
      "$BASE_URL/api/products" || true

    curl -sS \
      --max-time "$REQUEST_TIMEOUT" \
      -o /dev/null \
      "$BASE_URL/api/products" || true
  done

  echo "Worker $id finished after $request loops"
}

for i in $(seq 1 "$CONCURRENCY"); do
  worker "$i" &
done

wait

echo
echo "Load test completed."
echo "Now check scaling with:"
echo "AZURE_CONFIG_DIR=\$HOME/.azure az containerapp revision list -g rg-con-italy -n con-frontend-private -o table"
echo "AZURE_CONFIG_DIR=\$HOME/.azure az containerapp revision list -g rg-con-italy -n con-backend-private -o table"

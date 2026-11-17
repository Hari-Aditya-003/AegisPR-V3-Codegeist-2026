#!/usr/bin/env bash
set -euo pipefail

site=${1:-https://aegispr-v3.snap-hub.workers.dev}
site=${site%/}

for route in / /guide /benchmarks /settings /atlassian; do
  curl -fsS --max-time 15 -o /dev/null "$site$route"
done
curl -fsS "$site/health" | jq -e '.status == "ok" and .arbitrary_execution == false' >/dev/null
curl -fsS "$site/api/v2/demo" | jq -e 'length == 12' >/dev/null

for route in /api/v2/config /api/v2/reviews /api/v2/benchmarks; do
  test "$(curl -sS -o /dev/null -w '%{http_code}' "$site$route")" = 401
done

review_id=$(curl -fsS "$site/api/v2/demo" -H 'Content-Type: application/json' \
  --data '{"fixture_id":"py-coupon-floor"}' | jq -er .id)

for ((attempt=1; attempt<=20; attempt++)); do
  review=$(curl -fsS "$site/api/v2/demo/$review_id")
  state=$(jq -er .status <<<"$review")
  case "$state" in
    QUEUED|RUNNING) sleep 1 ;;
    REGRESSION_FOUND) break ;;
    *) printf 'Unexpected fixture status: %s\n' "$state" >&2; exit 1 ;;
  esac
done

jq -e '(.executions | length == 6) and .status == "REGRESSION_FOUND" and .cost.calls == 0' <<<"$review" >/dev/null
curl -fsS -o /dev/null "$site/reviews/$review_id"
jq -c .receipt <<<"$review" | curl -fsS "$site/api/v2/verify-receipt" \
  -H 'Content-Type: application/json' --data-binary @- | jq -e '.verified' >/dev/null
curl -fsS "$site/api/v2/demo/$review_id/repair" -H 'Content-Type: application/json' \
  --data '{}' | jq -e '.repair.status == "FIX_VERIFIED" and (.repair.checks | length == 3)' >/dev/null

printf 'Homepage, guide, benchmarks, settings, Atlassian, owner access, signed proof and fixture repair passed.\n'
printf 'Public evidence: %s/reviews/%s\n' "$site" "$review_id"

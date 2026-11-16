#!/usr/bin/env bash
set -euo pipefail

if [[ $# != 1 || -e "$1" ]]; then
  printf '%s\n' 'Usage: scripts/seed-demo.sh /path/to/new-demo-directory' >&2
  exit 2
fi
fixtures="$(cd "$(dirname "$0")/../demo/seeded-prs" && pwd)"
git init --quiet --initial-branch=main -- "$1"
cd "$1"
git config user.name 'AegisPR demo'
git config user.email 'aegispr-demo@example.test'
git config commit.gpgsign false
git config core.autocrlf false
mkdir store
cp "$fixtures/contract.json" .aegispr.json
cp "$fixtures/base.json" store/quotes.json
git add -- .
git commit --quiet -m 'DEMO-1 Establish coupon quote contract'

for scenario in regression clean inconclusive; do
  git switch --quiet -c "$scenario" main
  if [[ "$scenario" == inconclusive ]]; then
    git mv store/quotes.json store/draft-quotes.json
  else
    cp "$fixtures/$scenario.json" store/quotes.json
  fi
  git add -- .
  git commit --quiet -m "DEMO-1 Coupon quote $scenario"
done

git switch --quiet main
git branch --format='%(objectname) %(refname:short)'

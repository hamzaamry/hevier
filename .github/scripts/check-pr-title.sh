#!/usr/bin/env bash
# The pull request title becomes the squash commit and the changelog line, so it
# must read `type(scope): subject`: subject of 1 to 5 words, lowercase start, no period.
# Usage: check-pr-title.sh "<title>"
set -euo pipefail

title=${1:-}
pattern='^(feat|fix|perf|refactor|chore|test|docs|ci)\(([a-z0-9]+(-[a-z0-9]+)*)\)!?: (.+)$'

fail() {
  echo "::error title=PR title::$1 Expected: type(scope): subject (types: feat fix perf refactor chore test docs ci; subject up to 5 words, lowercase, no period). Got: $title"
  exit 1
}

[[ $title =~ $pattern ]] || fail "The title does not match type(scope): subject."
subject=${BASH_REMATCH[4]}
words=$(wc -w <<< "$subject" | tr -d ' ')

[[ "$words" -le 5 ]] || fail "The subject has $words words."
[[ $subject =~ ^[a-z0-9] ]] || fail "The subject must start in lowercase."
[[ $subject != *. ]] || fail "The subject must not end with a period."
echo "PR title ok: $title"

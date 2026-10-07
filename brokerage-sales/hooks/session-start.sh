#!/usr/bin/env bash
# Inject the real-estate plugin's rules (and the broker profile, if onboarded) at session start.
root="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
profile="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}/profile.md"

echo "# real-estate plugin context"
awk 'BEGIN{c=0} /^---$/ {c++; next} c>=2' "$root/skills/real-estate-context/SKILL.md"
echo
if [ -f "$profile" ]; then
  echo "## Broker profile (from /brokerage-sales:onboarding)"
  cat "$profile"
else
  echo "## Broker profile"
  echo "Not set up yet. If the user starts real estate work, suggest /brokerage-sales:onboarding once."
fi

boxes="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}/buy-boxes.json"
if [ -f "$boxes" ]; then
  echo
  echo "## Saved buy boxes (editable via /brokerage-sales:buy-box)"
  cat "$boxes"
fi

conns="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}/connectors.json"
if [ -f "$conns" ]; then
  echo
  echo "## Connector mapping (capability slot -> this user's tool; edit via /brokerage-sales:connectors)"
  cat "$conns"
else
  echo
  echo "## Connectors: not mapped yet. Offer /brokerage-sales:connectors once when a skill needs a CRM, calendar, e-sign or similar."
fi

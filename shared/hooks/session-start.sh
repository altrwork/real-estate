#!/usr/bin/env bash
# Inject the real-estate plugin's rules (and the broker profile, if onboarded) at session start.
root="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
profile="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}/profile.md"

data="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}"
echo "# real-estate plugin context"
echo "Data dir (REAL_ESTATE_HOME): $data. Read and write profile.md, connectors.json, buy-boxes.json, active-brand and brands/ ONLY here; never hardcode ~/.claude/real-estate."
echo
awk 'BEGIN{c=0} /^---$/ {c++; next} c>=2' "$root/skills/real-estate-context/SKILL.md"
echo
if [ -f "$profile" ]; then
  echo "## Broker profile (from /{{PLUGIN}}:onboarding)"
  cat "$profile"
else
  echo "## Broker profile"
  echo "Not set up yet. If the user starts real estate work, suggest /{{PLUGIN}}:onboarding once."
fi

boxes="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}/buy-boxes.json"
if [ -f "$boxes" ]; then
  echo
  echo "## Saved buy boxes (editable via /{{PLUGIN}}:buy-box)"
  cat "$boxes"
fi

conns="${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}/connectors.json"
if [ -f "$conns" ]; then
  echo
  echo "## Connector mapping (capability slot -> this user's tool; edit via /{{PLUGIN}}:connectors)"
  cat "$conns"
else
  echo
  echo "## Connectors: not mapped yet. Offer /{{PLUGIN}}:connectors once when a skill needs a CRM, calendar, e-sign or similar."
fi

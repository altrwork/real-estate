# Real estate

Plugins, skills and data connectors for commercial real estate workflows, one plugin per practice. Tampa Bay first (Pinellas, Hillsborough, Pasco, Polk), on public-record data from the CRE Harness connector.

| Plugin | What it does |
|---|---|
| `brokerage-sales` | Prospect, win the listing with a BOV, market it (flyer, postcard, outreach), run the contract to close. |

Install: `/plugin marketplace add <this repo>`, then `/plugin install brokerage-sales@real-estate`, then run `/brokerage-sales:onboarding`.

## Layout

- `<plugin>/` is a complete plugin (`.claude-plugin/plugin.json`, `.mcp.json`, `skills/`, `hooks/`).
- `shared/` is the source for the setup skills every plugin carries (`onboarding`, `connectors`, `brand-setup`, `real-estate-context`), the session hook, the connector slot list and demo brand. A plugin installs alone, so each carries a synced copy: edit `shared/`, then run `python3 scripts/sync-shared.py` (`--check` in CI). `{{PLUGIN}}` becomes the plugin's name.
- User state (profile, brand packs, connector mapping, buy boxes) lives in `~/.claude/real-estate/` (override with `REAL_ESTATE_HOME`), so it is shared by every plugin.
- Connectors are capability slots and operations (`shared/connectors/`), not products; see the `connectors` skill and [CONNECTORS.md](CONNECTORS.md).

## Adding a practice plugin

Create `<name>/` with a `.claude-plugin/plugin.json`, add it to `.claude-plugin/marketplace.json`, run the sync script, and write its skills. Candidates: `leasing`, `property-management`, `capital-markets`.

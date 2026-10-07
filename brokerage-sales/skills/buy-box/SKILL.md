---
name: buy-box
description: Define a prospecting target (asset type, county, size range) and pull the matching off-market owners from county appraiser records. Use when the user wants to pick a niche, e.g. "industrial, Hillsborough, 15k-35k sf", or says /buy-box.
metadata:
  version: "0.1.0"
---

# Buy box

**Data dir.** Resolve it first: run `echo "${REAL_ESTATE_HOME:-$HOME/.claude/real-estate}"` and use that exact path for every read and write of `profile.md`, `connectors.json`, `buy-boxes.json`, `active-brand` and `brands/`. Never type `~/.claude/real-estate` by hand: `REAL_ESTATE_HOME` points test runs at a scratch folder, and the session-start text names the resolved path.

A buy box = asset type + geography + size (optionally hold period, owner type). It replaces what brokers use CoStar for, sourced from the Hillsborough/Pinellas (also Pasco/Polk) property appraiser rolls via `cre-harness`.

1. Get the three parts. If the user has no focus yet, run `market-research` first. Default to what they know best.
2. Size it: `count_parcels` with `county`, `property_type` (industrial, warehouse, retail, office, multifamily, vacant_land, ...), `min_sqft`/`max_sqft`, plus optional `city`/`zip`. ALWAYS pass `sale_type: any` when sizing or pulling an owner universe: the default `arms_length` silently drops parcels with no recorded or only unqualified transfers (smoke test, Hillsborough industrial 15-35k sf: 41 default vs 115 with `any`). `industrial` and `warehouse` are separate categories; count both for an "industrial" box. Report the count before pulling.
3. Pull: `search_parcels` with the same filters (page with `cursor`). Signals: `held_since` (e.g. '1996-01-01' for 30-year owners, likely retiring), `out_of_state`, `max_owner_parcels`, and `estate_signals_only` (estate/heir owners; highest intent).
4. Resolve owners: `resolve_owner` per parcel (LLC to people, filing email, Form D phone); portfolios via `owner_portfolio`.
5. Include on-market properties too. Owners with a listing at another broker still belong in the database (they own other buildings).
6. Save it (see Storage). Boxes change: never assume a default asset type, county, or size anywhere else in the plugin; other skills read the saved boxes or ask.

## Storage

Boxes live in `buy-boxes.json` in `$REAL_ESTATE_HOME` (default `~/.claude/real-estate/`), a list of named objects: `name`, `active` (bool), `criteria` (the exact `search_parcels` filters used), `updated` (date), `notes`. Subcommands by intent: create, edit (change criteria, bump `updated`), activate/deactivate, list, delete. Several boxes can be active at once (e.g. industrial Hillsborough and retail Pinellas). When editing, show old vs new criteria and the new `count_parcels` count before saving. Each box can also be tied to a buyer (CRM contact) for `list-finder`.

Never invent phones or emails. Individual owners' phones are not in public record; say so.

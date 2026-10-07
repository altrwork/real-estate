---
name: list-builder
description: Build or extend the contact list (owners, developers, brokers, lenders, attorneys) for a criteria set, e.g. "all commercial owners in Pasco County". Use for /list-builder or whenever the user wants to pull people for outreach at any deal stage.
metadata:
  version: "0.1.0"
---

# List builder

One list serves prospecting and marketing, so build a profile per person, not a one-off export.

1. Criteria from the user or a saved box in `buy-boxes.json` (see `buy-box`); if several are active, ask which.
2. Owners: `search_parcels` (`county`, `property_type`, sqft, `city`/`zip`) then `resolve_owner` (people behind the LLC, filing email, Form D phone for DST/LP/fund), `entities_for_person`, `get_entity`, `owner_portfolio`.
3. Brokers/agents, lenders, attorneys: use any connected source (CRM, Apollo, etc.); `find_lenders` for lenders. Say what was and wasn't available.
4. Per row: name, entity, properties owned, mailing address, email/phone only if sourced, buy box (if known), last touch, stage.
5. Write to the CRM connector if present, else `workspace_save` (kind `contact`, with `owner_name`, `parcel_id`, `notes` for buy box), else a CSV in the working directory.

Dedupe on entity + mailing address. Don't fabricate contact data.

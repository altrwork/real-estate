---
name: recent-sales
description: Pull recently sold properties in Pinellas and Hillsborough from the county appraiser sales files via the CRE Harness connector. Use when the user asks what sold lately, wants a recent-sales feed by city, zip, asset type or size, wants new comps for a subject, or says /recent-sales.
metadata:
  version: "0.1.0"
---

# Recent sales

Uses the `cre-harness` connector (Pinellas and Hillsborough Property Appraiser sales files; Pasco and Polk work the same way). Read `data_coverage` first for `sales:<county>` dates: that date is the freshness limit.

1. **Scope**: county (ask if missing; never guess), window start (`transferred_since`, default 90 days back), and any of `city`, `zip`, `property_type`, `min_sqft`/`max_sqft`, `min_price`/`max_price`. Pick `property_type` from the user's buy box if one exists.
2. **Size it**: `search_parcels` with `count_only: true` and the same filters. If over ~200, tighten the filters or page with `cursor` rather than pulling everything.
3. **Feed**: `search_parcels` with `transferred_since`, `sale_type: arms_length` (market sales, newest first). Rows are parcels whose LAST transfer is in the window, so a parcel that sold twice shows once.
4. **Flag, don't hide**:
   - `deal_parcels` > 1: the price is the whole deal's total, not this building's. Never sum or divide it into a price per sf.
   - Run `sale_type: non_arms_length` separately for $100 estate, family and divorce deeds. Not comps, but the best prospecting signal.
5. **Fresher than the roll (Pinellas only)**: `recent_recordings` with `signal: ["deed"]` and `since` set to the day after the sales file date shows deeds recorded since. These have no price in the roll yet; label them "recorded, not yet in the county sales file". Hillsborough has no such feed on this connector; say so.
6. **Comps for a subject**: `comparable_sales` with the subject's `parcel_id` (`<county>:<id>`); pass `window_months` 6-12 for a tight set and `sold_after` to cut off a broken market. Don't assemble comps by hand.
7. **Output** a table: address, city, type, sf, sale date, price, $/sf, buyer, flags. Close with the `as_of` date and count. Anything recorded after it is missing, not zero; the newest 30-45 days of deeds always read thin, so don't call that a slowdown.

Offer to save the list with `workspace_save` or hand it to `list-builder`. If the `cre-harness` tools are unavailable, tell the user to authorize the connector (`/mcp`) and stop; don't answer from memory.

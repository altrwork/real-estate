---
name: tampa-property-research
description: Research a Hillsborough or Pinellas County property from county appraiser records using the CRE Harness connector. Use when the user gives an address, folio, or parcel ID in the Tampa Bay area and wants ownership, assessed value, sale history, flood zone, zoning, or comps, e.g. before listing or pricing a property.
metadata:
  version: "0.1.0"
---

# Tampa property research

Uses the `cre-harness` connector (Hillsborough Property Appraiser and Pinellas County Property Appraiser rolls, plus Pasco and Polk).

1. **Resolve** the address with `resolve_address`. If it returns hits in several counties, ask which one; never pick for the user. Pass `county` when known.
2. **Facts**: `lookup_property` with the returned `parcel_id` (owner, mailing address, land use, size, assessed/just value, homestead).
3. **History**: `sale_history` for deeds and prices. A price of $100 is a non-arm's-length transfer; do not use it as a comp. If `deal_parcels` > 1 the price covers several parcels.
4. **Site**: `property_zoning` and `flood_zone`; `site_aerial` if the user wants a visual.
5. **Value context**: `comparable_sales` for the subject.
6. Report with the `as_of` date. Anything recorded after it is missing, not zero.

If the `cre-harness` tools are unavailable, tell the user to authorize the connector (`/mcp`) and stop; don't answer parcel facts from memory.

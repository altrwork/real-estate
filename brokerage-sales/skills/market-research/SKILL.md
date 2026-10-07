---
name: market-research
description: Rank property subsets by how often they transact, from county appraiser sales records, to decide which buy box to prospect. Use when the user asks what's selling, which size band or asset type transacts most, or says /market-research.
metadata:
  version: "0.1.0"
---

# Market research

Goal: find the subset most likely to sell, so a listing won is more likely to transact.

1. Take a county and asset type (or a buy box).
2. For each size band (e.g. <15k, 15-40k sf) compute `sold in window / total parcels`, over 1, 3 and 5 years. Denominator: `count_parcels` (county, `property_type`, `min_sqft`/`max_sqft`) with `sale_type: any`, so unsold parcels stay in (the default drops them and inflates turnover). Check `industrial` and `warehouse` separately. Numerator: same filters plus `transferred_since` set to the window start and `sale_type: arms_length`. Note `transferred_since` matches each parcel's LAST transfer, so multi-sale parcels count once. Use `recent_sales` to list the sales behind a band.
3. Keep `sale_type: arms_length` for rates (drops $100/unqualified transfers). Flag multi-parcel deeds (`deal_parcels` > 1): their price is a total, not this building's.
4. Output a table: band, parcels, sales per year, annual turnover %, and a ranked recommendation. Example finding shape: "15-40k sf industrial turns 8%/yr vs 5% under 15k."
5. State the `as_of` date; the newest 30-45 days of deeds are missing, so do not read recent thinness as a slowdown.

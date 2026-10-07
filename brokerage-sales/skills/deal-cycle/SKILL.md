---
name: deal-cycle
description: Map where a listing is in the commercial sale cycle and route to the right skill. Use when the user asks what to do next on a deal, wants the sale process explained, or says "walk me through selling a property".
metadata:
  version: "0.1.0"
---

# Deal cycle

Five stages. Route to the skill for the stage; every stage feeds and reads the same contact list (the broker's database is their most valuable asset).

| Stage | What happens | Skills |
|---|---|---|
| 1. Prospecting (get the listing) | pick a buy box, find what transacts, build the list, earn the listing with a BOV | `buy-box`, `market-research`, `list-builder`, `bov` |
| 2. Listing out to market | flyer from county data + photos, then postcard / LinkedIn / email / call list | `flyer`, `marketing-outreach` |
| 3. Under contract | match buyers to the listing's buy box, log outreach, get to contract | `list-finder` |
| 4. Servicing the contract | coordinate inspectors, title, lender, attorneys; catch stalls | `contract-admin` |
| 5. Close | disbursement, deal wrap, close announcement | `close-out` |

Property management is a separate business line; not covered here.

Ask which stage and which property, then hand off. Don't re-explain stages the user already knows.

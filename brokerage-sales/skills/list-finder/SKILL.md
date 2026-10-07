---
name: list-finder
description: Match a listing to the contacts most likely to buy or lease it, using the CRM's history of buy boxes, past deals, emails and texts. Use when a listing is going to market and the user asks who to call or send it to, or says /list-finder.
metadata:
  version: "0.1.0"
---

# List finder

1. Define the listing's buy box (and compare it with the saved boxes in `buy-boxes.json` and any buyer-linked boxes) (type, area, size, price) from `lookup_property`.
2. Use `crm.find_by_buy_box` (then `crm.get_history` for the top matches) to find contacts whose recorded buy box, past purchases, or conversation notes fit (e.g. "said he does multifamily"). Also match prior-owner profiles from `owner_portfolio`.
3. Rank by fit and recency; show why each person matched (cite the note/deal). Output: top call list, the larger postcard/email list, and the rest.
4. Flag contacts whose buy box is unknown so the user can ask.

Needs the `crm` slot (operations in `connectors/contracts.json`, mapped in the user's `connectors.json`). If `crm.find_by_buy_box` is unmapped, search notes and tags with `crm.find_contacts` and say the matches are inferred. If the slot is unset, offer `/brokerage-sales:connectors`, and meanwhile fall back to `workspace_search` (the firm's contacts/deals in CRE Harness; pipeline stages: lead, pitched, bov_sent, listing_signed, on_market, under_contract, closed, lost).
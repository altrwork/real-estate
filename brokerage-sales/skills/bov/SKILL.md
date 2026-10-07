---
name: bov
description: Produce the Broker Opinion of Value that earns the listing: the "why me" pitch to the owner, in the broker's own brand. Use when a prospect shows interest or the user says /bov or asks for a BOV, opinion of value, or listing proposal.
metadata:
  version: "0.2.0"
---

# BOV

The document that wins the listing, so it needs a broker's voice and a "why me", not only a number. Facts come from `cre-harness`; layout and branding come from this plugin's brand pack, so nothing depends on the brand stored on the CRE Harness account.

## Steps

1. **Facts** (all from `cre-harness`; keep the `as_of` date): `resolve_address` / `lookup_property` (owner, use, SF, year, acres, last sale), `sale_history` (deed chain), `property_zoning`, `flood_zone`, `traffic_counts`, `resolve_owner` (people behind the LLC; use names only, never home addresses or emails in the document), `site_aerial` (see `flyer` for the labeled-aerial SVG).
2. **Comps**: `comparable_sales` with `parcel_id` (screens are built in; optional `window_months`, `cities`, `property_type`). Show the user the comps and range before rendering; they can drop or re-window comps. Copy comps verbatim; never add one.
3. **Broker's judgment**: ask for the value conclusion, recommended asking price, a short summary, and the "why me" (firm, track record, relevant deals; from the profile). Never invent these; unset fields print as visible placeholders. Income data (rent roll, NOI) is owner-supplied only; public record has none.
4. **Brand**: the active brand pack (`brand-setup`), same as the flyer. Agent headshot via `agent_photo`.
5. **Render**: write `data.json`, then
   `python3 "${CLAUDE_PLUGIN_ROOT}/skills/flyer/scripts/render.py" bov data.json <folder>/BOV.pdf --brand <slug>`
   Open the PDF and check every page before handing it over. Needs Chrome or Chromium.
6. Send only after the user approves, and only as a draft email via Gmail (`marketing-outreach` rules). Log `workspace_save` stage `bov_sent` on the deal.

## data.json (BOV fields, on top of the brand and agent fields in `flyer`)

`address_street, address_city, property_line, prepared_date, prepared_for, cover_image (aerial SVG), range_low, range_high, range_mid, rate_median, rate_q1, rate_q3` (raw numbers from `comparable_sales`: `indicated_low/high/mid`, `median`, `q1`, `q3`; the renderer rounds the range to the nearest $5,000), `subject_sf, comps_basis, as_of, evidence_text, method_text, value_conclusion, asking_price, executive_summary, why_us, facts{}, ownership{}, comps[{address, sale_date, sqft, year_built, sale_price, psf}], deeds[{date, price, grantor, grantee}]`.

## Method text must match what was done

The template's range is the comparable sales' rate band times building SF, midpoint = median rate times SF. Describe exactly that, nothing more. Do not claim assessment-multiple or adjustment methods the plugin didn't run. State that it is not an appraisal.

## Alternative: server-rendered BOV

`generate_bov` (CRE Harness) renders a finished PDF with its own method and Google street-level imagery, but only in the brand stored on the account (one per account) and with the logo uploaded in mortr. Use it only if the user asks for that version; before running, `get_brand` and stop if it isn't their brand (sync via `brand-setup` step 4 with a yes).

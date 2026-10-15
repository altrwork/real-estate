---
name: bov
description: Produce the Broker Opinion of Value that earns the listing: the "why me" pitch to the owner, as a branded landscape PowerPoint deck. Use when a prospect shows interest or the user says /bov or asks for a BOV, opinion of value, or listing proposal.
metadata:
  version: "0.4.0"
---

# BOV

The deck that wins the listing, so it needs a broker's voice and a "why me", not only a number. Facts come from `cre-harness`; layout and branding come from this plugin's brand pack, so nothing depends on the brand stored on the CRE Harness account. Output is a Letter landscape (11 x 8.5 in) `.pptx` the broker can edit.

## Steps

1. **Facts** (all from `cre-harness`; keep the `as_of` date): `lookup_property` (owner, use, SF, year, acres, last sale), `sale_history` (deed chain), zoning and flood zone, traffic counts, `resolve_owner` (people behind the LLC; names only, never home addresses or emails in the document), `site_imagery` (see `flyer` for the labeled-aerial approach). Demographics and jobs for the market slide are not in the connector; use them only from a source you can cite, or skip that slide.
2. **Comps**: `comparable_sales` with `parcel_id` (screens are built in; optional `window_months`, `cities`, `property_type`). Show the user the comps and range before building; they can drop or re-window comps. Copy comps verbatim; never add one. Compute the indications (average, median, any excluded-comp variant) from those comps only.
3. **Broker's judgment**: ask for the value conclusion, a short summary, and anything the deck says about strategy or the market. Never invent these; unset fields print as visible `[placeholders]`. Income data (rent roll, NOI) is owner-supplied only; public record has none.
4. **Brand**: the active brand pack (`brand-setup`), same as the flyer. Agent headshot as `agent_photo`.
5. **Build**: write `data.json` (see `references/example-data.json`), then
   `node "${CLAUDE_PLUGIN_ROOT}/skills/bov/scripts/build_deck.js" data.json <folder>/BOV.pptx --brand <slug>`
   Needs `pptxgenjs` (`npm install -g pptxgenjs`); Chrome or Chromium turns an SVG logo into a bitmap. Open the deck and check every slide before handing it over.
6. Send only after the user approves, and only as a draft email via Gmail (`marketing-outreach` rules). Log `workspace_save` stage `bov_sent` on the deal.

## Slides

Each section opens with a title slide (section number, name, and the slides in it). A section with no slides is dropped and the rest renumber.

| Section | Slides |
|---|---|
| Cover | Cover |
| 1 Introduction | **Opinion of Value** (the letter and the contents on one slide, with section page numbers), executive summary |
| 2 Location Overview | Location overview (`location`), market and economic drivers (`market`) |
| 3 Property Overview | Property overview (`property`), zoning and land use (`zoning`) |
| 4 Property Valuation | Valuation methodology (`methodology`), comparable sales with a $/SF chart (`comps`), valuation summary (`valuation`) |
| 5 Marketing Strategy | Marketing and disposition strategy (`strategy`) |
| 6 About Us | Firm story, stats, and the broker's bio (`about`) |

A slide whose section is left out of `data.json` is skipped. `about` always prints; unset fields show `[placeholders]`, so fill it from the brand profile (firm history, credentials) and never invent track record.

## data.json

Top level: `address_street, address_city, property_line, prepared_for, prepared_date, salutation, agent_name, agent_title, agent_phone, agent_email, agent_photo, cover_image, subject_sf, value, range_low, range_high, letter[], about{paragraphs[], stats[], bio}`, plus the sections above. `references/example-data.json` shows every field. Brand fields in `data.json` (`primary_color`, `display_font`, `firm`, `logo`) override the pack. Image paths must be absolute.

`value` is the broker's number. `range_low`/`range_high` are raw numbers (the indicated low and high); the builder rounds them to the nearest $5,000 and prints them as "$3.4 to $3.8 million". Comp `$/SF` and indication totals are computed from the numbers you give, so don't type them.

## Writing the letter

Plain and first-person: thank the owner, say what the opinion rests on (which comps, which ZIP or submarket), give the range and the value in the same numbers the valuation slide shows, say what we have not seen (leases, rent roll, condition) and that it could move the number, and offer to walk through it. Four short paragraphs; it shares the slide with the contents.

## Method text must match what was done

The range is the comparable sales' rate band times building SF. Describe exactly that, nothing more. Do not claim assessment-multiple, income or adjustment methods the plugin didn't run. State that it is not an appraisal.

## Alternative: server-rendered BOV

`generate_bov` (CRE Harness) renders a finished PDF with its own method and Google street-level imagery, but only in the brand stored on the account (one per account). Use it only if the user asks for that version; before running, `get_brand` and stop if it isn't their brand (sync via `brand-setup` step 4 with a yes).

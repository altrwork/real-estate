---
name: flyer
description: Create the branded property flyer (and matching postcard), the core marketing piece, from county data, GIS/aerial context, property photos, and the broker's brand. Use when a listing is won and the user asks for a flyer, one-pager, postcard, or /flyer.
metadata:
  version: "0.2.0"
---

# Flyer and postcard

Core content: photos, highlights, area overview, specs (building size, parcel dimensions, road frontage, access), price, contact. Every other channel is this content reformatted. Always use the fixed templates; do not redesign the layout.

## Steps

1. **Brand**: use the user's active brand pack (`active-brand` in the data dir, or the one they name; created by `brand-setup`) and obey its `rules`. `render.py` finds it with `--brand <slug>` or by itself. No pack: run `brand-setup` first, don't fall back to the bundled `vector` demo. `get_brand` is a last resort. Map `primary_color`, `display_font`, `body_font`, `firm`, `address`+`city_state_zip`, `phone`, `web`; signer from `card` (name, title, license, phone, email). Build `google_fonts` as a css2 query from the two fonts (e.g. `family=Cinzel:wght@500;700&family=Roboto:wght@400;700`). A brand pack is the preferred source because it carries the real logo and the firm's usage rules; `get_brand` is the fallback. If the brand is null, or its `notes` show it was scraped from another firm's site (`source_url` isn't the user's), stop and have the user confirm or fix it with `set_brand`. Never ship someone else's brand.
2. **Listing facts you don't have** (asking price, sale vs lease, photos, agent): leave them as placeholders and say so; never fill from memory. LoopNet and similar sites block automated reads (bot protection); don't try to bypass it, ask the user to paste the listing text or photos.
3. **Logo**: a brand pack supplies it. Otherwise `get_brand` says only `has_logo`, not a file. Ask for the logo file (the onboarding profile has its location) and pass its absolute path as `logo_src`. Without one, the firm name is set in the display font.
3. **Property facts**: `lookup_property`, `property_zoning`, `flood_zone`. Specs only from these or from the user; never guess clear height, dock doors, rent, or price.
4. **Area**: `site_aerial`, `street_view`, `list_neighbors`, `traffic_counts`, `trade_area`. Download the `image_url` JPEG right away (the link expires). Build `aerial.svg` with the JPEG embedded as a base64 data URI (an SVG used as a background can't load external files), the `outline_points` polygon in the brand accent color (viewBox is the tool's `size_px`), and a label for the address. Only label roads you can confirm (the street in the address); never guess cross streets. Point `aerial_labeled` at the SVG.
5. **Photos and headshot**: each property has a folder of images (jpg/png/webp); the parent folder is in the onboarding profile. Pass it with `--photos <property folder>`: a file named `hero*` is the hero (else the first by name) and the next four fill the photo tiles. Name files so order is right. The agent's headshot path is in the profile; set it as `agent_photo` in `data.json` (square-ish, face near the top). No photos yet is fine: slots render gray; no headshot means no slot. Say which is missing. Never use stock or generated images of people or property.
6. **Render**: write a `data.json` (fields below), then
   `python3 "${CLAUDE_PLUGIN_ROOT}/skills/flyer/scripts/render.py" flyer data.json <property folder>/flyer.pdf --brand <slug>`
   and the same with `postcard`. Omit `--brand` when using `get_brand` values (then put those in `data.json`). It also writes an `.html` beside the PDF. Open the PDF and check it before handing it over. Needs Chrome or Chromium installed.
7. Show the user, apply edits by changing the data (not the template), re-render.

## Adding a brand pack

`<data dir>/brands/<slug>/` (the demo `vector` pack is in the plugin's `brands/`) holds `brand.json` (firm, web, phone, `address`, `city_state_zip` (joined into `firm_address` when `data.json` has none), `primary_color`, `accent_color`, `link_color`, `ink_color`, `muted_color`, `tint_color`, `border_color`, `display_font`, `body_font`, `google_fonts`, `headline_transform`, `logo_horizontal`, `logo_stacked`, `rules[]`) plus the logo files. `data.json` values override the pack. Create one with `brand-setup`.

## data.json fields

`google_fonts, primary_color, display_font, body_font, firm, logo_src, listing_type ("For Sale"/"For Lease"), price (or "Call for Price"), headline, address_line, highlights[], specs{label: value}, area_overview[], hero_photo, aerial_labeled, photos[], agent_photo (optional headshot path), agent_name, agent_title, agent_license, agent_phone, agent_email, web, firm_address`

Any missing text field prints as a visible `[field]` placeholder; fix before sending. Image paths must be absolute (`file:///...` or plain absolute paths).

## Postcard

9x6 in, two pages: front (hero photo, headline, price, logo), back (highlights, agent card, and a clear block for the USPS address/postage area). Leave that block empty. Printing and mailing (about 500 per listing, addressed from `list-finder`) are done outside this plugin.

Never include price if the user said not to; use "Call for Price".

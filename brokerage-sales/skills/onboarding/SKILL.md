---
name: onboarding
description: First-run setup for the real-estate plugin: check connectors, capture the broker's profile (name, firm, license, focus, photo folders, branding, CRM), and save it for later sessions. Use when the user is new to the plugin, says /onboarding or "set me up", or when no broker profile exists.
metadata:
  version: "0.2.0"
---

# Onboarding

Short and conversational; one question at a time, skip anything already known. Don't lecture about the plugin.

## 1. Connectors

Run the `connectors` skill (a full sweep of ALL slots: CRM, email, prospecting/contact data, outreach, calendar, storage, e-sign, meeting notes, team chat, listing platforms), following its phases and gate. Do not start step 2 until it returns a disposition for every slot; serving only the CRM and moving on is a bug. Teams differ, so don't assume a CRM or email product; detect what's connected, ask about the rest, and record the mapping. `property-data` (`cre-harness`) is the only hard requirement: if `data_coverage` fails, tell them to authorize it via `/mcp` and pause. Everything else can be manual and added later. Also check that Chrome/Chromium exists (needed for PDFs).

## 2. Broker profile

Ask for, in this order: name, firm, title (printed on flyers and BOVs), license number, phone/email for flyers, track-record line for the BOV "why me" (e.g. firm volume, relevant deals), parent folder where property photo folders live (one folder per property, e.g. `Properties/1801-28th-st-n/`), the path to their headshot (a clear head-and-shoulders photo), and where brand guidelines/logo are. The CRM was already decided in step 1; copy it into the profile, don't ask again. Never invent or guess any of these.

- **Skippable:** license, title and track record can be skipped; record them as `(not provided)` and say flyers and BOVs will leave them off.
- **License help:** if they don't know it, in Florida it is on the DBPR lookup (myfloridalicense.com, "Search for a license", Real Estate Commission, by name; sales associates read SL#######, brokers BK#######). Offer to skip, don't guess.
- **Email check:** if the flyer email doesn't look like the person's name or the firm's domain, confirm it once before saving.
- **Where files live:** keep photo folders and the headshot outside the plugin directory (suggest `$REAL_ESTATE_HOME/properties/` and `$REAL_ESTATE_HOME/headshot/`). Files inside the plugin repo can end up committed and published.

Buy boxes are NOT part of the profile. If the user names a focus, hand off to `buy-box` to save it as an editable box; say they can change it any time.

## 3. Save

Record paths as absolute paths. Write `profile.md` to `$REAL_ESTATE_HOME` (default `~/.claude/real-estate/`, shared by every plugin in this marketplace; create the directory). Use a short bullet list, one fact per line. Tell the user where it is. The SessionStart hook loads it every session; they can edit it by hand or re-run this skill.

Then hand off to `brand-setup` so flyers and postcards carry THEIR brand (the bundled `vector` pack is a demo; use it only for someone at Vector). Offer `set_brand` too so BOVs match; brand-setup shows current vs new first, since the stored brand may belong to another firm.

## 3b. Check

Confirm the photo folder and headshot paths exist (list them). Don't proceed with a bad path.

## 4. First win

Offer a concrete next step based on the profile: `buy-box` for the stated focus (sizes the universe in seconds), or `tampa-property-research` on a property they name.

---
name: marketing-outreach
description: Turn the flyer into channel-specific marketing: email blast, LinkedIn post, postcard (snail mail), and a day-one call list. Use after the flyer exists, or when the user says /marketing-outreach.
metadata:
  version: "0.1.0"
---

# Marketing and outreach

All channels are the same property information in different forms.

| Channel | Form |
|---|---|
| Email blast | the PDF flyer + short body, via `email.draft` (draft only; `email.send` and `outreach.add_to_sequence` need explicit approval of the exact recipients and text). If the email slot is search-only (Outlook), give the text and attachment for them to paste |
| LinkedIn | flyer content as a post |
| Postcard | `flyer` skill renders it from the same data; the firm typically gets ~500 per listing, so select the best 500 from `list-finder` |
| Calls | top ~5-20 highest-probability buyers for day one |

Listings are too varied for one rigid template, so ask for tone/emphasis each time. Log every touch with `outreach.log_touch` / `crm.add_note` (else `workspace_save`). If an "Outreach Engine" connector is added, use it for sends and tracking.

Never send anything on the user's behalf without explicit approval.

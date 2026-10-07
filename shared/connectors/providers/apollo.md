# Apollo (claude.ai connector)

Fills: contact-data, outreach, and a light CRM. Mapping hints (verify on connect; names are as seen in this repo's sessions):

| Op | Tool |
|---|---|
| contact-data.find_people | `apollo_mixed_people_api_search` (search, no credits for the search itself) |
| contact-data.enrich | `apollo_people_match` / `apollo_people_bulk_match` (spends credits; show the estimate) |
| contact-data.lookup_company | `apollo_organizations_enrich` |
| crm.find_contacts | `apollo_contacts_search` |
| crm.upsert_contact | `apollo_contacts_create` / `apollo_contacts_update` (overwrites existing values and cannot be undone; update replaces `label_names`) |
| outreach.add_to_sequence | `apollo_emailer_campaigns_add_contact_ids` (sends from the user's mailboxes) |

Quirks: tool replies can include a credit block; surface it. Apollo is B2B sales data, so commercial owners that are LLCs often resolve to a registered agent, not the principal; use `resolve_owner` from cre-harness first.

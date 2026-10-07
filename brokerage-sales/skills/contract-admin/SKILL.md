---
name: contract-admin
description: Run the under-contract checklist: schedule inspectors, HVAC, title, lender and attorney follow-ups, and flag stalled parties. Use once a deal is under contract or the user says /contract-admin.
metadata:
  version: "0.1.0"
---

# Contract admin

The broker's job here is making sure everyone else does theirs. Deals die from silence (e.g. a lender going unresponsive).

1. Get contract date, closing date, buyer/seller, and parties (attorneys, lender, title, inspectors).
2. Build a dated timeline back from closing: due diligence, inspections, appraisal, financing, title, survey.
3. For each party: last contact, next action, owner. Use `email.search_threads` for last-contact lookups, `calendar.list_events` for dates, and `email.draft` for requests (no sends without approval; `calendar.create_event` sends no invitations unless asked).
4. Flag risk: no response in 3+ business days, or a deadline within 5 days with an open item. Suggest a backup (e.g. alternate lender).
5. Output a short status board; update it each run.

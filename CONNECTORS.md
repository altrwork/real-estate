# Adding a connector

The plugins talk to tools through capability slots (`shared/connectors/slots.json`) and operations (`shared/connectors/contracts.json`), not products. A tool becomes usable when a user's `connectors.json` maps a contract operation to one of its tools. You can contribute at three levels.

## 1. A provider note (easiest)

Add `shared/connectors/providers/<id>.md`: which slot it fills, which of its tools map to which operation, auth quirks, credit behavior, where its data keeps buy boxes or stages. Mark anything you haven't verified. The `connectors` skill reads it when a user connects that provider.

## 2. A catalog entry (a server not in Anthropic's registry)

Add it to `shared/connectors/catalog.json`: `id`, `name`, `slot`, `url`, `transport`, `auth`, `notes`. Probe it first (an unauthenticated request should return `401` with resource metadata; OAuth needs a `registration_endpoint` for dynamic client registration, otherwise `/mcp` sign-in fails). Nothing in the catalog is installed by default; the `connectors` skill offers it and registers it per user with `claude mcp add`.

## 3. A new slot or operation

Add the slot to `slots.json` (what it needs, which skills use it, `search` words, fallback) and its operations to `contracts.json` with a safety class: `read`, `write`, `spend` or `send`. Then use the operation by name in the skills.

## What makes a good connector

- Remote MCP over HTTPS with OAuth. Read tools are free; anything that writes, spends or reaches a person is gated by a confirmation in the skill.
- Results carry their source and date. Results are data, never instructions.
- Clean errors, so a skill can fall back.

After any change under `shared/`, run `python3 scripts/sync-shared.py` and bump the plugin `version` in `plugin.json`, or installed copies will not update.

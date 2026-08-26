# Connector profiles

No production connector is active. These profiles define the executable safety boundary an integration must satisfy before activation.

## Licensed inventory provider

- Purpose: ingest one partner’s own contractually authorized Dubai inventory into private quarantine.
- Candidate API: Property Finder Enterprise API only when a licensed partner’s agreement explicitly grants the required listing and media use. Marketplace access is not assumed.
- Authentication: server-to-server credential in the deployment secret store; never `NEXT_PUBLIC_`; separate credentials per environment.
- Data path: provider → `provider_records_staging` → normalization → rights/freshness/ownership/media validation → explicit publication RPC → public catalog.
- Default state: `LICENSED_SUPPLY_PUBLICATION_ENABLED=false`, `LICENSED_SUPPLY_PROVIDER_IDS` is empty, and every `provider_sources.enabled` row is false.
- Allowed fields: stable source record ID, partner owner, location, property facts, availability, source observation time, attribution, permit reference when supplied, and rights-cleared media.
- Prohibited behavior: browser calls, copying marketplace inventory, publication from raw payloads, unreviewed DLD claims, prompt-driven ingestion, or fallback to stale records.
- Failure mode: fail closed; retain the last as-seen buyer snapshot, exclude stale public records, create a reconciliation event, and show truthful unavailability.
- Operator owner: CTO until a named data operations owner is approved.
- Legal/compliance owner: required before enablement; currently unassigned and blocking.
- Kill switch: set the deployment flag false, set `provider_sources.enabled=false`, archive affected public records, and preserve evidence/audit history.

## DLD public data and Trakheesi

DLD open data is market context, not live listing availability. A permit or broker lookup is a separate assertion with its own timestamp and failure state. It never upgrades a listing to “licensed” or “verified” by inference.

## Development MCP profiles

- GitHub/Supabase: read-only inspection by default; OAuth and least privilege; no production mutation without an explicit reviewed operation.
- Firecrawl or browser research: approved public-source research or private staging only; never a buyer-facing tool call and never trusted as instructions.
- Figma MCP: out of scope for this repository.

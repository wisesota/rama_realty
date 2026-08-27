# Licensed supply activation gate

Rama remains an illustrative decision prototype until every item below has current evidence. Keep `LICENSED_SUPPLY_PUBLICATION_ENABLED=false` and `LICENSED_SUPPLY_PROVIDER_IDS` empty until then. At activation, add only the approved provider's stable lowercase identifier; removing that identifier is its provider-specific kill switch.

## Required approval record

- named licensed partner and organization ID;
- signed data/publication/media rights, geography, and permitted distribution surfaces;
- attribution wording and expiration;
- stable project/listing/ad identifiers and deletion/correction obligations;
- availability and price freshness SLA;
- legal/compliance owner and technical operator owner;
- commercial terms and lawful/disclosed introduction model;
- preview/staging evidence for quarantine, normalization, cross-tenant denial, stale exclusion, provider outage, reconciliation alert, and rollback.

## Technical activation sequence

1. Create a disabled `provider_sources` row with the approved bounded geography and freshness window.
2. Ingest contractually approved staging records only; retain raw input privately.
3. Validate ownership, publication window, media rights, attribution, identifiers, price, availability, and freshness.
4. Review rejected records and reconciliation events; never repair missing facts with model inference.
5. Run hosted multi-identity RLS and provider-outage tests.
6. Name alert, incident, rollback, and audit owners.
7. Enable the source, global deployment gate, and exact provider identifier in a bounded cohort through a recorded approval.
8. Publish only validated records; enable advisor handoff only when the property has an eligible licensed organization.

`publishValidatedProviderRecord` in `lib/integrations/provider-publication-server.ts` is the only application publication entry point. It enforces the deployment-wide switch and the exact provider allowlist before calling the service-role RPC. The database source row (`enabled`, current rights, freshness, and media confirmation) is the authoritative backstop, so neither an environment flag nor a database row can activate supply alone. Removing the provider identifier from `LICENSED_SUPPLY_PROVIDER_IDS` stops new application publications immediately; disabling the source row also withdraws its already-published properties.

Current state: **BLOCKED EXTERNALLY / DISABLED**. No contractual provider, legal owner, or hosted staging evidence exists. The checked-in production activation record is deliberately `draft` and cannot pass `pnpm release:readiness`. Production readiness also inventories every deployable file under `public/images`, `public/lottie`, and `public/rive`; any file absent from the approved rights register is a blocker, even if no component currently references it.

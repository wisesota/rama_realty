# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dubai property buyers who need to reason across lifestyle, budget, location, timing, and incomplete evidence. The first product wedge is a buyer who finds listing portals useful for discovery but inadequate for preserving criteria, unknowns, sources, and changes across a high-stakes decision.

## Product purpose

Rama is a voice-led Dubai property-discovery and decision-support product. A buyer speaks or types a natural brief, reviews the structured criteria, confirms it once, and enters a governed Decision Room where candidate facts retain their source and evidence state.

## Positioning

Rama is buyer-controlled decision assurance, not a property portal, developer site, or brokerage claim. Its visible product behavior is: voice-led Dubai property discovery with explainable criteria.

## Operating context

Current public residence records, prices, and matches are illustrative until a licensed inventory source is connected. Illustrative residences cannot be sent to an advisor. For eligible published records, human continuity requires explicit buyer consent.

## Capabilities and constraints

- Gemini voice and typed input converge into the same editable `PreparedBrief`.
- `/api/discovery/prepare` is side-effect-free; persistence and search begin only after explicit confirmation through `/api/discovery/query`.
- `/discover/{searchRunId}` is the only results and evidence-dossier surface.
- Supabase is canonical for application data; owner-scoped data requires authenticated ownership and RLS.
- Property facts show their source and observation state when available.
- Buyers can keep, export, or erase eligible decision records.
- No public claim may imply live inventory, market performance, a partnership, a customer result, an award, or professional advice without approved evidence.

## Brand commitments

- Name: Rama.
- Design direction: Rama Decision Architecture—Archivanta-inspired structural pacing, original Rama composition, and Nordic Lagom clarity.
- Voice: plain-spoken, calm, exact, buyer-aligned, and explicit about uncertainty.
- Visual language: warm paper, blue-black ink, Fjord blue, pale sky, restrained sand, square evidence planes, editorial architectural crops, and minimal elevation.

## Evidence on hand

- Approved product, inventory, handoff, and source-state language in `docs/CLAIMS_REGISTRY.md`.
- One project-owned architectural hero registered in `docs/PUBLIC_ASSET_RIGHTS.json`; documentary proof and legal review remain pre-production gates.
- Governed typed buyer, evidence, and Decision Ledger contracts in the repository.

## Product principles

1. **Show the decision, not an intelligence claim.** Demonstrate criteria, evidence, unknowns, and changes.
2. **Voice first, never voice only.** Text provides complete functional recovery in every state.
3. **Unknown is a valid state.** Missing evidence is not replaced with confident prose.
4. **Confirm before persistence.** Buyers review what Rama understood before the Decision Room opens.
5. **Consent before continuity.** Advisor handoff is eligible-data-only and buyer-controlled.
6. **One governed truth.** Client state presents the experience; it never becomes property truth.

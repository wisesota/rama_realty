<!-- /autoplan restore point: C:\Users\rtf70\.gstack\projects\rama-agent\main-autoplan-restore-20260819-192809.md -->
# Archivanta to Rama Realty: evidence-led adaptation plan

Status: implemented as the route-first adaptation
Source: user-provided "Archivanta to Rama Realty: Design Language Analysis & Implementation Plan"
Date: 2026-08-19

## Outcome

Evolve Rama into a warmer, quieter Editorial Property Atelier without changing its product truth: voice-led Dubai property discovery, explainable criteria, and explicitly illustrative inventory until a licensed provider is connected.

The landing remains a brief-entry and trust surface. Search persists the governed envelope and routes to `/discover/{searchRunId}`. The Buyer Decision Room is the sole result, evidence, dossier, and advisor-handoff surface.

## Premises to verify

1. Archivanta is useful as a compositional reference, not a product or credibility template.
2. Rama should preserve the approved Source Serif 4 and Instrument Sans pairing, 1200px rail, restrained sky-and-sand accents, and 16px editorial media corners.
3. The dark Address Signal hero and voice modal can be replaced because the repository contract now names the daylight Editorial Property Atelier as the approved public direction.
4. Illustrative inventory must stay explicit at the result level or immediately adjacent to the result set; a remote footer-only disclosure is too easy to miss.
5. Unsupported counters such as residences reviewed, transaction volume, neighborhoods covered, or client satisfaction must not ship.
6. Existing search, Gemini voice, Zustand, Decision Room, and Supabase contracts should be reused. This is a presentation and interaction refactor, not a backend rewrite.

## Proposal assessment

### Adopt

- Warm gallery canvas, ruled planes, generous vertical rhythm, and minimal navigation chrome.
- One dominant project-owned architectural image inside the 1200px rail.
- Inline voice interaction attached to the search composition.
- Editorial result hierarchy with a lead residence and quieter secondary residences.
- Property dossier with image navigation, visible match reasons, progressive detail, Escape close, focus return, and responsive stacking.
- Dark closing statement only if it improves the existing footer without fabricating claims.
- Reduced-motion behavior, keyboard semantics, 44px touch targets, and overflow checks.

### Adapt

- Keep 16px media corners instead of zero-radius imagery. Sharp geometry remains appropriate for controls and ruled containers.
- Keep restrained sky blue as the action/focus accent. Brass may appear only as a minor sand-adjacent detail.
- Replace FLIP and swipe-dismiss complexity in the first slice with an explicit accessible dialog transition and mobile full-height sheet. Add gesture dismissal only if tests prove it does not conflict with scroll or assistive technology.
- Keep the desktop hero heading on one line and use the exact project-owned `public/images/rama-hero-editorial-daylight.png` asset.
- Keep evidence labels and source status near the results while reducing repeated badge chrome.
- Derive any displayed counts only from the current governed response, never from invented market-scale data.

### Reject

- Fabricated credibility counters (`2,400+`, `AED 4.2B`, `99% satisfaction`, or similar).
- Footer-only illustrative-inventory disclosure.
- Claims such as `Source verified today` unless the response carries that exact governed provenance and timestamp.
- New sample property imagery or remote stock imagery when the repository-owned asset set is sufficient.
- Zeroing the global media radius, removing all compact controls, or replacing the existing design-token contract with one-off Archivanta variables.
- Treating a dossier media shape change as backend-minimal when the current envelope lacks governed gallery/floor-plan/payment-schedule data.

## Implemented route-first slice

### Landing invitation and voice composition

- Keep the existing warm daylight atelier hero.
- Use the existing `SectionShell`, `MediaFrame`, `VoiceSignal`, `VoiceConversation`, and focused Zustand selectors.
- Place natural-language search and voice in one inline ruled composition.
- Keep text search fully equivalent to voice.
- Remove the landing results grid, current-brief band, property detail modal, and competing marketing sections.
- Submit text or voice through the existing discovery contract, then navigate to the durable Decision Room route.
- Preserve component-owned media streams, abort paths, timers, and cleanup.

### Evidence-led Decision Room

- Render the lead residence as an image-led editorial plane inside the room bounds.
- Render secondary residences as a quieter ruled list against the same brief.
- Keep the response-level source disclosure and property-level provenance visible without badge-heavy repetition.
- Preserve selection, comparison, empty, loading, error, restoration, and governed-result behavior.

### Progressive property dossier

- Expand `Learn more` inside the existing route-backed room instead of adding a second modal system.
- Expose location, price, specs, match reason, illustrative/source status, and ruled evidence before any advisor handoff.
- Keep the intercepted route dialog's Escape, focus trap, focus return, scroll lock, and direct full-page fallback.
- Progressive detail may reveal only fields that already exist in governed data; missing floor plans, payment schedules, or investment scenarios are not fabricated.

### Inline room follow-up and instrumentation

- Keep voice follow-up inline at the bottom of the room, with written tools always available.
- Emit redacted funnel events to the development console only. Production remains disabled until an analytics adapter and consent contract are approved.

## Architecture

```text
app/page.tsx
  -> LandingStoreProvider
    -> LandingPage
      -> SiteHeader
      -> AtelierHero
        -> text search -> store.searchProperties -> /api/discovery/query
        -> VoiceSignal + VoiceConversation -> existing Gemini session adapters
        -> persist envelope -> /discover/{searchRunId}
      -> SiteFooter

app/@modal/(.)discover/[searchRunId] + app/discover/[searchRunId]
  -> BuyerDecisionRoom
    -> lead residence + ruled shortlist
    -> progressive property dossier -> governed agent tools
    -> inline voice composer -> existing Gemini Live session adapter
    -> consented advisor handoff for eligible published records

Supabase / governed catalog -> discovery service -> BuyerDecisionEnvelopeV1
                                         -> Zustand presentation projection
```

## Failure and rescue registry

| Failure | User-visible rescue | Verification |
| --- | --- | --- |
| Microphone denied or unavailable | Keep the same text composer active and explain how to continue | Permission-denied browser path and keyboard submission |
| Voice session fails mid-turn | Stop every track/session, retain transcript if safe, return focus to composer | Unit contract plus browser exercise |
| Search fails | Keep prior results, show concise problem and retry path | Store tests and rendered error state |
| Zero results | Keep the brief visible, explain that no exact illustrative match exists, invite refinement | Empty-state render |
| Image load fails | Preserve meaningful alt text and stable media geometry | Browser request failure check |
| Dossier closes by Escape/scrim/button | Restore trigger focus and document scroll | Keyboard browser check |
| Reduced motion requested | Disable nonessential transforms/loops and keep state changes legible | Browser media emulation |
| Narrow viewport | No horizontal scroll; dossier and controls remain usable | 320, 390, 768px checks |

## Test diagram

```text
typed brief -> persist -> intercepted room          [store unit + browser]
direct room URL -> restored full page                [browser]
voice trigger -> permission -> live/recorded/error  [existing contracts + source review]
lead -> Learn more -> governed dossier               [browser]
dialog trap -> Escape -> focus return                [keyboard browser]
desktop/mobile/reduced-motion                        [browser matrix]
dev event -> exact redacted payload                  [unit]
production event -> no console output                [unit + browser]
```

## Not in scope for this slice

- Licensed inventory provider connection or new market-data ingestion.
- New Supabase schema or changes to RLS, authentication, connector credentials, or Gemini token routes.
- Floor plans, payment schedules, investment scenarios, verification timestamps, or gallery arrays not already present in governed data.
- Fabricated odometer statistics.
- Dashboard/CRM redesign.
- Deployment, PR creation, or shipping automation.

## Verification gates

- Read the applicable Next.js 16.3.1 local documentation before changing framework code.
- Render at 320, 390, 768, 1024, 1280, and 1440px using `http://localhost`.
- Confirm `scrollWidth === innerWidth` at every width.
- Check keyboard-only search, voice start/stop/recovery, dossier open/close, focus trap, and focus return.
- Check reduced motion and no looping decorative motion at idle.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Run `gstack-design-review`, `gstack-qa`, and `gstack-review` before handoff.

## Decision audit trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Intake | Treat Archivanta as reference, not source of product truth | Mechanical | Explicit over clever | Rama's repository contract controls product claims and assets | Literal visual clone |
| 2 | Intake | Preserve illustrative disclosure near results | Mechanical | Choose completeness | Users must not mistake local samples for licensed live inventory | Footer-only disclosure |
| 3 | Intake | Reject unsupported odometer statistics | Mechanical | Choose completeness | Motion cannot make fabricated credibility claims acceptable | Animated market-scale claims |
| 4 | Intake | Preserve 16px media corners and sky accent | Taste | Explicit over clever | These are approved Rama identity tokens | Global zero-radius/brass-only rewrite |
| 5 | Intake | Reuse the existing dialog and voice/session architecture | Mechanical | DRY | Existing code already owns cleanup, focus, and state contracts | Parallel component systems |

## Phase 1 CEO review: resolved by the route-first decision

### Current-state correction

The user proposal was written against an older visual baseline. The current tracked landing already uses the daylight hero asset, voice/search composition, editorial property layout, a dossier-like section, and a dark closing composition. The implementation plan must therefore be a delta against commit `c3f9fde`, not a replay of the six proposed sprints.

The more important architectural correction is that successful text and voice searches already navigate to the route-backed `/discover/{searchRunId}` Buyer Decision Room. The legacy `selectedProperty` modal on the landing is not the governed dossier and should not be expanded into a second product surface.

### What already exists

| Sub-problem | Existing implementation | Review decision |
| --- | --- | --- |
| Daylight atelier hero | `components/landing-page.tsx` uses `rama-hero-editorial-daylight.png` | Keep; review the rendered delta only |
| Text and voice entry | Existing `VoiceSignal`, `VoiceConversation`, and shared discovery path | Reuse; inline-vs-modal remains an interaction choice |
| Governed result envelope | `BuyerDecisionEnvelopeV1` carries entities and source summary | Render directly in the Decision Room |
| Restorable dossier | Route-backed `BuyerDecisionRoom` with intercepted dialog and full-page fallback | Make this the only governed dossier |
| Explainable source truth | Property-level provenance plus response-level source summary | Preserve property-level labels when provenance is mixed |
| Decision tools | Details, comparison, payment schedule, floor plan, documents, scenarios, area, and handoff | Refine the existing room rather than inventing empty dossier sections |
| Analytics scaffolding | PostHog event helpers and dashboard calculations | Wire consent-aware events; helpers are currently not used by product surfaces |

### Strategic landscape

- Layer 1: natural-language property search is now the conventional category approach.
- Layer 2: major portals are adding conversational and voice experiences backed by large proprietary data sets.
- Layer 3: Rama's defensible product is not the composer or editorial styling. It is the governed path from ambiguous brief to source-backed decision history and consented advisor continuity.

### Outside voices

Both independent reviewers found the same three critical issues:

1. The proposal's baseline is stale and includes work already present in the current landing.
2. A new landing dossier would duplicate and regress the selected route-backed Buyer Decision Room architecture.
3. Broad visual iteration is not a substitute for measuring decision quality or connecting licensed supply.

### CEO dual-voices consensus table

| Dimension | Independent reviewer | Codex outside voice | Consensus |
| --- | --- | --- | --- |
| Premises valid? | Ethical/design premises valid; baseline stale | Design constraints valid; demand and commercial premises assumed | Confirmed concern |
| Right problem? | Reframe around shortest trustworthy decision path | Reframe as decision-assurance layer | Confirmed disagreement with current plan |
| Scope calibration? | Too broad visually, too narrow strategically | Large regression surface; licensed activation excluded | Confirmed concern |
| Alternatives explored? | Product and sequencing alternatives missing | Business/distribution alternatives missing | Confirmed concern |
| Competitive risks covered? | Voice and styling are copyable | Portal data and distribution dominate | Confirmed concern |
| Six-month trajectory sound? | Risk of two dossier paradigms and visual churn | Risk of polished demo without supply proof | Confirmed concern |

### Required user challenge

The original request is to implement the Archivanta suggestion plan in the project. Both independent reviews recommend changing the implementation target:

- Keep the already-approved Editorial Property Atelier visual contract.
- Rebaseline from the current code and remove already-complete hero/grid/footer work.
- Make the route-backed Buyer Decision Room the only governed portfolio and dossier surface.
- Treat inline voice as a reversible experiment, not a settled redesign.
- Add consent-aware decision-funnel measurement.
- Keep licensed supply as the next activation milestone, without pretending it can be completed inside this frontend slice.

The user explicitly accepted this challenge and authorized the route-first implementation on 2026-08-19.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | ---: | --- | --- |
| CEO Review | `/gstack-plan-ceo-review` via `/gstack-autoplan` | Scope and strategy | 1 | RESOLVED | User accepted the route-first recommendation |
| Codex Review | outside voice | Independent second opinion | 1 | RESOLVED | Duplicate landing dossier was removed from scope |
| Eng Review | `/gstack-review` | Architecture and tests | 1 | DONE | Route, lifecycle, privacy, and diff review completed |
| Design Review | `/gstack-design-review` methodology | UI and UX gaps | 1 | DONE | Rendered desktop, mobile, overflow, keyboard, and focus checks completed |
| DX Review | `/gstack-plan-devex-review` | Developer experience | 0 | NOT APPLICABLE | Consumer UI change, not a developer-facing product |

**CROSS-MODEL:** Both outside voices independently recommend a route-first, instrumented Buyer Decision Room instead of a second landing dossier.

**VERDICT:** The route-first rewrite was approved and implemented. The landing is the invitation; the Decision Room is the governed experience.

**UNRESOLVED DECISIONS:** None for this slice. Licensed supply and a consent-approved analytics adapter remain separate future work.

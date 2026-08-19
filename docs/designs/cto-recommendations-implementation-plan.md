# CTO recommendations: route-first hardening plan

Status: approved for implementation by the user's 2026-08-19 request
Baseline: `c3f9fde` plus the uncommitted route-first Decision Room slice
Source: user-provided "Rama Realty — Comprehensive Document Analysis & CTO Recommendations"
Restore point: `C:\Users\rtf70\.gstack\projects\rama-agent\codex-route-first-decision-room-autoplan-restore-20260819.md`

## Outcome

Finish the route-first adaptation without reopening the landing/dossier decision. The landing remains the brief-entry and trust surface. `/discover/{searchRunId}` remains the sole governed result, dossier, comparison, voice follow-up, and advisor-handoff surface.

This pass hardens four truth boundaries the CTO document correctly identified:

1. text and voice searches share the same discovery orchestration;
2. published and illustrative records cannot be mislabeled;
3. buyer-session tokens rotate at identity or consent boundary changes without losing the restorable room;
4. operational tables remain unavailable to anonymous browser reads and direct browser writes.

## Recommendation analysis

### Already implemented and retained

- Landing result grid, current-brief band, legacy property modal, and duplicate marketing dossier were removed.
- Successful text and voice search navigate to the route-backed Decision Room.
- The room owns the lead property, ruled evidence ledger, progressive dossier, secondary list, inline voice follow-up, and consented handoff.
- Media corners remain 16px; the approved sky/sand Editorial Property Atelier tokens remain intact.
- Product events are development-only and reject raw briefs, transcripts, and contact data.
- The public catalog uses a `security_invoker` view and one publication predicate.

### Implement now

- Add a contract test proving `/api/discovery/query` and the voice `search_properties` tool both delegate to `discoverProperties`, returning the same `BuyerDecisionEnvelopeV1` contract.
- Enforce the actual provenance invariant in the runtime parser: `published` requires a non-null `organizationId`; an organizationless property must be `illustrative`. Keep `ready` as an envelope-completion state because approved demo mode can legitimately return an illustrative ready envelope.
- Add a prominent, exact illustrative-supply disclosure beside the landing search rail.
- Add a redacted `room.zero_results` development event containing allowlisted semantic criterion categories/count only, never values, labels, ordinal keys, or the raw brief.
- Rotate the opaque buyer-session token after login, OAuth callback, successful advisor handoff, password change, and sign-out. Use an atomic service-role RPC plus an old-token tombstone so a delayed request cannot recreate the retired hash as a second buyer session.
- Extend hosted Supabase verification to include anonymous reads of `search_runs` and `audit_events`, and add a static SQL contract test for the operational grants/RLS posture.
- Update implementation documentation with evidence and the honest hosted gates.

### Corrected or rejected recommendations

- Do not add a redundant `source_type` field. `property.provenance.kind` is already the typed per-property source discriminator; tests will make it non-optional and internally consistent.
- Do not require every `ready` envelope to be organization-backed. That confuses search completion with publication provenance and would silently disable the approved illustrative product mode.
- Do not add follow-up prompt chips. Existing governed tool actions already expose the available questions; another chip row would duplicate controls and add pill-heavy chrome.
- Do not enable PostHog, Sentry, Realtime, semantic search, gesture dismissal, fabricated counters, or new inventory claims.

## What already exists

| Concern | Existing source of truth | This pass |
| --- | --- | --- |
| Search orchestration | `lib/discovery-service.ts` | Prove both entry points use it |
| Public catalog predicate | `public.public_property_catalog` plus `PublicCatalogRepository` | Add parser/test defense in depth |
| Envelope parser | `isBuyerDecisionEnvelope` | Enforce provenance consistency |
| Buyer-session ownership | hashed cookie plus `buyer_sessions` foreign keys | Rotate the hash in place |
| Anonymous hosted check | `scripts/verify-supabase.mjs` | Cover all named operational tables |
| Funnel adapter | `lib/product-events.ts` | Add redacted zero-result event |

## Architecture and data flow

```text
text brief  -> POST /api/discovery/query ----+
                                                +-> discoverProperties
voice tool  -> POST /api/agent/tools --------+      -> PublicCatalogRepository
                                                       -> persist_buyer_search
                                                       -> BuyerDecisionEnvelopeV1
                                                       -> runtime parser
                                                       -> BuyerDecisionRoom

provenance invariant
  organizationId == null -> provenance.kind must be illustrative
  provenance.kind == published -> organizationId must be non-null

buyer-session rotation
  current HttpOnly token -> HMAC(old)
       -> lock the active buyer_sessions row
       -> tombstone HMAC(old) until its original expiry
       -> update the same row to HMAC(new), or revoke it on sign-out/user mismatch
       -> optionally bind user_id after authentication
       -> set the new HttpOnly cookie only after the transaction succeeds
       -> existing search_runs keep the same buyer_session_id when ownership is preserved
```

The rotation normally updates the existing row instead of creating a second session. Search runs, conversations, candidates, shortlist records, tool runs, and inquiries retain their foreign-key owner, while the old browser token stops resolving immediately. Sign-out or a different user signing into a shared browser revokes the prior buyer session instead of transferring its history. A tombstone check in `persist_buyer_search` prevents an old tab from resurrecting the retired hash. Database commit and browser cookie delivery cannot be perfectly atomic; a lost response can require the buyer to start a new brief, and this limitation remains explicit.

## Failure and rescue registry

| Failure | Handling | Verification |
| --- | --- | --- |
| Voice and text routes drift | Shared orchestration spy test fails | Vitest contract test |
| Published record has no organization | Runtime envelope parser rejects it | Positive/negative contract tests |
| Organizationless record claims published provenance | Runtime envelope parser rejects it | Regression test |
| Session row rotation fails | Do not replace the cookie; surface the existing action error path | RPC and mocked-cookie tests |
| Old token is reused after rotation | Tombstone blocks `persist_buyer_search` from recreating it | SQL contract/concurrency test |
| Zero-result event leaks criteria values | Event adapter derives only allowlisted categories and reconstructs the payload | Exact console-payload test |
| Shortlist expansion reveals an offscreen dossier | Move focus and scroll the dossier heading into view; respect reduced motion | Keyboard/browser check |
| Tool response for A arrives after selection changes to B | Abort or invalidate the request and verify captured property ID before render | Regression helper plus browser delay check |
| Hosted anonymous role sees operational rows | `pnpm verify:supabase` fails | Hosted verifier; external environment required |

## Test diagram

```text
ENTRY-POINT CONTRACT
  text POST  -> discoverProperties(source=text)  -> envelope [unit]
  voice tool -> discoverProperties(source=voice) -> same envelope [unit]

PROVENANCE CONTRACT
  published + organization        -> accept [unit]
  illustrative + no organization  -> accept [unit]
  published + no organization     -> reject [unit]

SESSION CONTRACT
  existing token + session row -> tombstone old -> update same row -> set new cookie [SQL + unit]
  delayed old token           -> rejected, never recreated [SQL]
  no persisted session row      -> set fresh cookie for next search [unit]
  database update error         -> keep old cookie, throw [unit]

PUBLIC FLOW
  landing disclosure -> search -> room -> zero state/dossier -> handoff [browser]
  shortlist Learn more -> earlier dossier -> focus + visible heading [browser]
```

## Implementation tasks

- [x] Add orchestration and provenance contract tests.
- [x] Implement tombstoned buyer-session rotation and call it at login, OAuth, handoff, password-change, and sign-out boundaries.
- [x] Prevent delayed dossier-tool responses from crossing property selections.
- [x] Add the landing disclosure and privacy-safe search-outcome event.
- [x] Keep shortlist expansion legible by focusing and revealing the dossier heading.
- [x] Extend Supabase verification and document local versus hosted evidence.
- [x] Run lint, typecheck, tests, build, security review, design review, and browser verification.

Sequential implementation is preferred. The changes are small but converge on the shared contract and test files; worktree parallelism would add coordination cost without shortening the critical path.

## Not in scope

- Enabling leaked-password protection or MFA in the hosted Supabase dashboard; these require project-owner authority and live verification.
- A licensed inventory/provider contract or ingestion pipeline; this is the next activation milestone, not a frontend patch.
- Retention/deletion policy approval or scheduled deletion jobs; legal/product ownership is required before code can encode a policy.
- Production analytics, consent integration, PII scrubbing certification, or production observability activation.
- Hosted multi-identity RLS, backup/restore, device/audio, privacy, and penetration testing. The repository can provide repeatable probes but cannot claim those environments passed.

## Decision audit

| Decision | Classification | Rationale |
| --- | --- | --- |
| Keep route-first architecture | Settled product decision | Prevents competing truth surfaces |
| Enforce provenance, not `ready == published` | Architecture correction | Envelope state and source status represent different facts |
| Rotate the same session row | Security/continuity | Invalidates the token without orphaning durable room ownership |
| Log criterion keys only | Privacy | Measures zero-result themes without buyer text |
| Keep hosted controls as external gates | Evidence boundary | Local code cannot prove dashboard or production state |

## Design review resolution

- Replace the existing `property-brief-guidance` line with the exact approved disclosure, preserving the input's `aria-describedby` relationship. Use a left-aligned ruled provenance line that wraps normally; do not add a badge or second disclosure component.
- Derive zero-result categories from an allowlist (`location`, `bedrooms`, `budget`, `property_type`, `lifestyle`, `flexible`). Current ordinal criterion keys are not analytics taxonomy and must never be emitted directly.
- Emit the event once per empty search run, including under React Strict Mode, with no new visible UI or live-region announcement.
- When shortlist `Learn more` selects a property and expands the earlier dossier, focus a `tabIndex={-1}` dossier heading and scroll it into view. Use instant scrolling when reduced motion is requested.
- Keep shortlist numerals compact and use the existing sand token. Do not enlarge them into competing display elements.
- Verify the new landing line at 1280x720 as well as the standard desktop/mobile matrix; short-height overlap is the main responsive risk.

## Engineering review resolution

- Add a private token-tombstone table with a primary-key hash and indexed expiry. The service-role rotation function locks rows in a consistent order and keeps its transaction short.
- Replace `persist_buyer_search` with the same signature plus an early active-tombstone rejection before its create-if-missing branch.
- Rotate advisor handoff inside the inquiry RPC by accepting the next token hash, then set the browser cookie only after the RPC returns successfully.
- Use explicit bind/rotate/revoke modes. Sign-out revokes and unbinds instead of preserving a prior user's Decision Room on a shared browser.
- Cancel or invalidate a dossier tool request on selection change/unmount and verify the captured property ID before applying returned blocks.
- Enforce provenance equivalence in both `PublicCatalogRepository` mapping and the runtime parser; verify source-summary counts against entity provenance.
- Emit a single `room.search_outcome` event for every outcome, not only empty results, so category-level zero-result rates have a denominator. Production remains disabled.
- Harden the hosted verifier so only an empty 200 response or explicit 401/403 denial passes; 404/5xx/network failures must fail closed.
- Test shared discovery success and the intentionally different text/tool failure transports.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | ---: | --- | --- |
| CEO Review | `/gstack-plan-ceo-review` via prior `/gstack-autoplan` | Scope and strategy | 1 | CLEAR | Route-first direction already accepted by the user |
| Codex Review | outside voice | Independent second opinion | 1 | CLEAR | Duplicate landing dossier rejected |
| Eng Review | `/gstack-plan-eng-review` | Architecture and tests | 1 | CLEAR WITH FIXES | Token resurrection and stale dossier response folded into implementation |
| Design Review | `/gstack-plan-design-review` | UI and UX gaps | 1 | CLEAR | 8/10; disclosure, semantic zero-result taxonomy, and shortlist focus folded into plan |
| DX Review | applicability gate | Developer experience | 0 | NOT APPLICABLE | Internal API routes are not a developer-facing product |
| Security Review | `/gstack-cso` | Auth, token rotation, Supabase, and supply chain | 1 | CLEAR WITH FIXES | Rotation recovery, revocation fallback, and false-green hosted verification corrected |
| Code Review | `/gstack-review` | Pre-handoff correctness | 1 | CLEAR WITH FIXES | Concurrency, stale-request, route-return, and focus defects corrected and re-reviewed |
| Rendered Design Review | `/gstack-design-review` with supported browser fallback | Implemented visual system | 1 | CLEAR | Editorial hierarchy, 16px media geometry, disclosure, and mobile sheet verified |
| Browser QA | `/gstack-qa` with supported browser fallback | Route and interaction funnel | 1 | CLEAR | Landing, modal and direct routes, dossier focus, focus trap, Escape return, and responsive overflow verified |

**VERDICT:** The corrected route-first implementation is complete and locally verified. Hosted controls remain explicit external gates.

NO UNRESOLVED DECISIONS

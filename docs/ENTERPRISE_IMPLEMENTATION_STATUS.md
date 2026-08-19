# Rama Realty enterprise implementation status

Date: 19 August 2026
Status: vertical slice implemented and locally verified; production activation gates remain

## Shipped product slice

Rama now has one buyer-to-CRM path:

```text
speech or text
  -> typed same-origin route
  -> cookieless governed catalog repository
  -> atomic buyer session + search persistence
  -> BuyerDecisionEnvelopeV1
  -> /discover/{searchRunId} Decision Room
  -> explicit consent
  -> idempotent CRM inquiry + audit + outbox
```

Text uses `/api/discovery/query`. Gemini Live uses `/api/agent/tools`; the final voice transcript does not launch a second search. Both paths use the same repository, publication predicate, persistence RPC, envelope, and route-backed room.

## Buyer experience

- The landing hero remains the primary entry point for both text and voice.
- Gemini 3.1 Flash Live is pinned to the native audio-to-audio model and receives a short-lived token.
- Ten allowlisted real-estate tools cover search, details, comparison, official payment schedules, deterministic buyer scenarios, floor plans, documents, development facts, area context, and advisor handoff preparation.
- The Decision Room opens as an intercepted desktop lightbox and full-page mobile/direct-navigation experience.
- Result entities use numeric AED and area fields, explicit units, per-property provenance, observation time, and version.
- Official payment schedules and buyer-selected finance/yield scenarios are separate blocks with separate labels.
- The URL contains only the opaque search-run ID, never the raw buyer brief.
- Reload and direct navigation restore only when the opaque buyer cookie owns the search run.

## CRM and data governance

- `public_property_catalog` applies live, published, available, unexpired, and 30-day source-freshness rules. Organizationless platform seeds remain illustrative.
- Public reads use a cookieless publishable-key client, independent of any staff session.
- Tenant inserts begin as drafts; illustrative status is reserved for platform seeds.
- Properties and all child records enforce parent-organization equality.
- Published property facts, related records, and published-plan installments are immutable until returned to review.
- Payment-plan publication checks installment totals and deterministic default/effective ordering.
- Buyer sessions use a 256-bit opaque HttpOnly cookie and store only an HMAC digest.
- Identity and consent boundaries rotate the opaque token through a service-only RPC. The active row is locked and normally updated in place; the retired hash is tombstoned so a delayed tab cannot recreate it through search persistence. Sign-out and shared-browser identity mismatches revoke prior ownership.
- Search persistence stores the candidate property version, source observation time, and minimal fact snapshot.
- Agent telemetry stores allowlisted IDs, field names, result classes, timings, and correlation IDs, not raw buyer briefs or wholesale tool arguments.
- Advisor requests require explicit consent and one contact channel, validate property membership in the owned search run, deduplicate by idempotency key, and write the inquiry, audit event, and CRM outbox together.
- `/dashboard/inquiries` is organization scoped and status changes pass through a service-only transition RPC that rechecks the verified staff actor and writes an audit event.

## Security boundaries

- Same-origin mutation routes fail closed on missing `Origin` in production.
- Request bodies and field lengths are bounded.
- Shared hosted rate limits use a stable HMAC of scope plus proxy address and fail closed in production.
- Agent tool names and every tool's arguments are runtime validated; extra fields are rejected.
- Model output is parsed into discriminated unions before Zustand or React sees it.
- React renders known components only; there is no arbitrary model HTML, URL fetch tool, SQL tool, `eval`, or dynamic component execution.
- Service-role access is isolated to narrow server modules for rate limiting, persistence, inquiry creation, and audited CRM transitions.
- Direct browser DML on buyer operational/audit tables is revoked and denied by RLS.
- Runtime provenance validation rejects published properties without an organization owner, illustrative properties with an organization owner, and envelope source-summary counts that disagree with the rendered entities.
- Development-only funnel events include one redacted room outcome per search run. They contain opaque identifiers, counts, and allowlisted criterion categories only; production output remains disabled.

## Verification evidence

Current local gates:

- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test`: 16 files, 63 tests pass
- `pnpm build`: pass
- `pnpm audit --audit-level=high`: Storybook and `sharp` advisories remediated through 8.6.18 plus a patched `sharp` override; two high-severity `image-size` parser denial-of-service advisories remain in the development-only Storybook graph because the registry has not yet published the advisory's patched 2.0.3 release. Storybook's production build passes.
- `pnpm verify:supabase`: the probe now checks RLS and anon grants through a service-only posture RPC, then verifies that anonymous reads expose no rows from `search_briefs`, `search_runs`, `buyer_sessions`, `tool_runs`, `inquiries`, or `audit_events`; unexpected 404/5xx responses fail. A fresh hosted multi-identity run remains required after applying the token-rotation migration.
- `pnpm verify:gemini-live`: `gemini-3.1-flash-live-preview`, one tool call/response, 61 native audio chunks, both transcripts, completed turn
- Rendered browser QA: landing and room checked at 320, 390, 768, 1024, 1280, and 1440px, including the 1280x720 short desktop. The client-navigation room is a viewport-bounded mobile sheet, direct navigation restores the full-page room, and neither surface has horizontal overflow. The React Aria dialog trapped focus through 24 repeated Tab presses, closed on Escape, returned focus to the actual landing trigger, focused the earlier dossier after shortlist expansion, and kept advisor handoff disabled for illustrative records. Reduced-motion CSS and the dossier scroll branch were reviewed. No new PostHog duplicate-initialization warning appeared after the provider guard.
- Hosted migrations previously verified: `buyer_decision_room_foundation` and `advisor_lint_and_index_hardening`. The repository migration `20260819120000_buyer_session_token_rotation.sql` is locally reviewed and tested but not claimed as hosted-applied.
- Supabase security advisor: one external setting warning, leaked-password protection disabled
- Supabase performance advisor: no WARN-level findings; only expected unused-index INFO notices on a new low-traffic schema

## Honest remaining gates

These are external activation work, not hidden application TODOs:

1. Enable leaked-password protection in Supabase Auth.
2. Load licensed inventory and governed child facts. The current visible record is illustrative, so advisor handoff is intentionally unavailable for it.
3. Approve the production retention/deletion schedule, consent wording and policy version, privacy terms, advisor response-time promise, and cross-brokerage routing rules.
4. Enforce staff MFA/step-up and document the privileged staff provisioning runbook.
5. Configure deployment secrets and production observability without raw transcripts, audio, buyer briefs, or PII in operational logs.
6. Run the deployed multi-identity RLS matrix, backup/restore exercise, browser/device/audio matrix, privacy review, and independent penetration test.

Supabase advisor remediation: [Password strength and leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

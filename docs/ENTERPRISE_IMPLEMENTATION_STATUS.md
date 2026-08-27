# Rama Realty enterprise implementation status

Date: 22 August 2026
Status: repository-owned Decision OS foundation implemented and locally verified; production activation gates remain

## Shipped product slice

Rama now has one buyer-to-CRM path:

```text
speech or text
  -> editable confirmation with explicit search consent
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
- Buyers can authenticate by email, save normalized briefs, restore decision history, select up to three prior runs, and compare only currently governed property records.
- Buyers can export a versioned account or current-browser record. Anonymous deletion is bound to the opaque browser session; authenticated account deletion requires a ten-minute, one-time account-email step-up bound to the resulting Auth session.

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
- Processor erasure is queued before inquiry/CRM cascade with an actionable internal locator. A service-only worker core uses persisted expiries, unique fencing tokens, bounded parallel calls, adapter abort deadlines, result validation, attempt exhaustion, and honest `processor_pending` request state; no production adapter or scheduler is implicitly enabled. Retention never age-deletes pending, processing, failed, or processor-pending work; terminal evidence is retained for 24 months after completion.

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
- Public experience, landing composition, confirmation, locale routing, evidence-v2 writing, evidence-v2 rendering, Live voice, licensed publication, and each licensed provider have independent server-side rollback controls. Partial Decision OS cohorts use an HMAC of the buyer-token digest across query, agent-tool, Live-token, and recorded-voice routes and fail closed when the cohort secret is unavailable. Landing rollback returns a localized non-cacheable `503` rather than unsupported legacy marketing; writer rollback stops transaction-local v2 trigger writes and returns v1 for new runs; renderer rollback returns the compatible v1 envelope while retaining readable previously persisted v2 data. Locale rollback preserves the legacy public route, and removing one provider identifier disables that provider without enabling another.
- `pnpm release:contract` validates the honesty and shape of checked-in release evidence. `pnpm release:readiness` consumes the draft activation record and fails closed until production approvals, hosted evidence, licensed-provider IDs, bounded cohort, rollback/on-call owners, credential rotation, backup restore, privacy canary, and penetration-test evidence are present. It also requires demo mode off and the target runtime's cohort, independent flags, provider IDs, and HTTPS site URL to match the approval.

## Verification evidence

Current local gates:

- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test`: 46 files, 199 tests pass
- `pnpm build`: pass; 23 static page entries generated and all dynamic routes compiled
- `pnpm e2e`: 17 Chromium tests pass across the route-complete illustrative demo, navigation/refresh and missing-run denial, responsive/RTL/reduced-motion coverage, dossier focus, microphone denial, bilingual confirmation, saved history/comparison, and authenticated deletion step-up
- `pnpm build-storybook`: pass with upstream Vite sourcemap, module-directive, eval, and bundle-size warnings
- `pnpm audit --audit-level high`: pass; verified no known vulnerabilities (storybook/nextjs image-size vulnerability is not present/resolved)
- `pnpm peers check`: pass; no peer dependency issues
- The full ordered migration chain through `20260822211710_harden_private_trigger_function_privileges.sql` parses and installs in PGlite 0.3.14, including the processor-erasure lease RPCs, defense-in-depth RLS on private operational tables, and explicit revocation of direct client execution on trigger-only functions.
- `pnpm verify:supabase`: passed against the sole development project after applying the pending plan migrations. The service-only posture RPC confirms RLS and anonymous denial for `search_briefs`, `search_runs`, `buyer_sessions`, `tool_runs`, `inquiries`, and `audit_events`.
- `pnpm verify:supabase-identities`: passed against development with two ephemeral confirmed Auth users. Own insert/read, cross-owner read denial, and cross-owner insert denial all passed; cleanup left zero verifier users and zero verifier briefs. Dedicated preview/staging credentials remain supported for repeatable CI evidence.
- `pnpm verify:gemini-live`: `gemini-3.1-flash-live-preview`, one tool call/response, 61 native audio chunks, both transcripts, completed turn
- Rendered browser QA: landing and room checked at 320, 390, 768, 1024, 1280, and 1440px, including the 1280x720 short desktop. The current automated pass covers trusted keyboard traversal, 320px EN, 390px RTL Arabic, no horizontal overflow, recorded-voice fallback, reduced-motion fallback, single-cycle decorative voice motion, saved-run comparison, and the authenticated deletion step-up lock. The React Aria dialog trapped focus through 24 repeated Tab presses, closed on Escape, returned focus to the actual landing trigger, focused the earlier dossier after shortlist expansion, and kept advisor handoff disabled for illustrative records.
- Hosted development migrations now include buyer-session rotation, confirmed-search idempotency, evidence ledger v2, provider quarantine, advisor evidence feedback, buyer data rights/retention, and private-schema hardening. Preview/staging/production are not inferred from this development result.
- Supabase security advisor: leaked-password protection remains disabled by the explicit Supabase Free-plan decision and is not a release gate. Its `SECURITY DEFINER` warnings are expected for the three authenticated RPCs that perform explicit actor/owner checks, and its no-policy notices are intentional deny-all tables accessed only through bounded privileged functions.
- Supabase performance advisor: no WARN-level findings; only expected unused-index INFO notices on a new low-traffic schema

## Honest remaining gates

These are external activation work, not hidden application TODOs:

1. Load licensed inventory and governed child facts. The current visible record is illustrative, so advisor handoff is intentionally unavailable for it.
2. Approve the production retention/deletion schedule, consent wording and policy version, privacy terms, advisor response-time promise, and cross-brokerage routing rules; implement and review each real processor adapter, then activate its scheduler and monitoring.
3. Enforce staff MFA/step-up and document the privileged staff provisioning runbook.
4. Configure persistent `RATE_LIMIT_SECRET` and `BUYER_SESSION_SECRET` plus the remaining deployment secrets and production observability without raw transcripts, audio, buyer briefs, or PII in operational logs.
5. Repeat the multi-identity RLS matrix in deployed staging, then run the backup/restore exercise, browser/device/audio matrix, privacy review, and independent penetration test.

# Rama Realty

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/wisesota/rama_realty?utm_source=oss&utm_medium=github&utm_campaign=wisesota%2Frama_realty&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Rama Realty is a voice-led Dubai property discovery and buyer-decision product. A buyer speaks or types a brief, Gemini 3.1 Flash Live acts as the conversational real-estate advisor, governed server tools retrieve facts, and the route-backed Buyer Decision Room renders those facts without model-generated HTML.

The current hosted catalog contains illustrative inventory. It is labelled as illustrative in every buyer result and cannot create an advisor inquiry because it has no brokerage organization. Licensed inventory must enter through the governed CRM publication workflow before production launch.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 and React Aria/shadcn primitives
- Zustand 5 for bounded landing and Decision Room presentation state
- Google Gen AI SDK with server-only credentials and ephemeral Live tokens
- Supabase SSR/Auth/Postgres/RLS for organizations, catalog, buyer sessions, searches, inquiries, CRM state, and audit events
- pnpm only, enforced by `preinstall`

## Local development

Prerequisites: Node.js 22 or newer and pnpm 11.20.0. The Node floor follows the installed Supabase client support window and is enforced by `package.json` plus `pnpm run doctor`.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The staff sign-in route is `/auth/sign-in`; authenticated operations are under `/dashboard`.

For the credential-free, route-complete illustrative flow, run `pnpm demo`. Confirmed demo searches are owner-bound in process memory for 30 minutes and disappear on restart; the demo never contacts Supabase for catalog or persistence work.

## Quality gates

```bash
pnpm check
pnpm run doctor
pnpm release:contract
pnpm verify:supabase
pnpm verify:supabase-identities
pnpm verify:telemetry
pnpm verify:gemini-live
```

`pnpm check` starts with a key/status-only environment contract, then runs lint, typecheck, unit/contract tests, and the production build. `pnpm run doctor` adds runtime, pnpm, port, and provider-reachability checks without printing credentials (`pnpm doctor` is a pnpm built-in and does not run the repository script). `pnpm release:contract` validates the machine-readable evidence without pretending that local checks authorize production. `pnpm release:readiness` is the fail-closed production gate and is expected to fail until the approval record, hosted evidence, licensed provider, owners, and persistent secrets are real; it also requires demo mode off and the actual runtime cohort, rollout flags, and provider IDs to match the approved activation record. The Supabase verifier uses the publishable key to confirm the governed public view and deny anonymous operational reads, then verifies the shared limiter through the server-only key. `pnpm verify:telemetry` performs a bounded authenticated PostHog query and an authenticated Sentry project read, confirms the DSN belongs to that project, and prints status only. The Gemini verifier synthesizes a spoken request, opens a native Gemini Live session with an ephemeral token, executes a governed brief-preparation tool call using the same shared tool manifest as the browser, returns the tool result, and confirms streamed native audio plus both transcripts.

## Buyer flow

1. The hero accepts the same property brief by text or native speech-to-speech.
2. Every entry path first creates a non-persisting written review through `POST /api/discovery/prepare`; the buyer can edit or cancel before any search run is written.
3. Confirming the review calls `POST /api/discovery/query` with an idempotency key. Text and Gemini Live then share `PublicCatalogRepository`, one publication predicate, one persisted buyer session, and the compatible v1/v2 Decision Envelope reader.
4. The app navigates to `/discover/{searchRunId}`. Client navigation opens an intercepted editorial dialog; direct navigation and refresh render the full-page fallback.
5. The room can retrieve details, comparisons, published payment schedules, deterministic purchase scenarios, floor plans, documents, development facts, area guidance, and a consented advisor handoff.
6. A handoff is written through a narrow idempotent server RPC and appears in `/dashboard/inquiries` with audited status transitions.

The opaque buyer token rotates at password login, native Supabase email-link callback, password change, advisor handoff, and sign-out. Rotation preserves the stable buyer-session owner when safe, tombstones the retired hash against delayed-tab resurrection, and revokes prior ownership on sign-out or shared-browser user mismatch.

The legacy `/api/property-search` route returns `410 Gone`. Production never substitutes local demo rows after a catalog error or legitimate zero-result response. Bundled samples are available only when `RAMA_DEMO_MODE=true`, remain explicitly illustrative, and are restored only through the bounded process-memory demo store.

## Gemini Live contract

The native audio path is pinned in code to `gemini-3.1-flash-live-preview`; an environment variable cannot silently downgrade the product model. The browser receives a short-lived constrained token, never `GEMINI_API_KEY`. The session supports streamed PCM audio, automatic voice activity detection, interruptions, input/output transcripts, resumable sessions, context compression, and ten allowlisted real-estate tools.

Gemini is the conversational interpreter, not the source of truth. It may narrate returned facts and ask useful follow-ups. It cannot query SQL, publish inventory, invent pricing or availability, call arbitrary URLs, render arbitrary components, or share contact details without an explicit buyer action.

## Supabase and CRM contract

Required local variables are documented in `.env.example`. Keep `SUPABASE_SECRET_KEY`, `BUYER_SESSION_SECRET`, `RATE_LIMIT_SECRET`, and `GEMINI_API_KEY` server-only.

Hosted migrations create:

- a freshness- and expiry-aware `public_property_catalog` view;
- tenant-safe publication and parent-organization triggers;
- immutable published facts and payment installments;
- opaque hashed buyer sessions, restorable search runs, candidate fact snapshots, and redacted tool telemetry;
- published property documents and deterministic child-record selection;
- consented, idempotent inquiry creation and a CRM outbox; and
- service-role-only operational RPCs, JWT/RLS-authorized buyer endpoints (e.g. decision ledger), role-scoped CRM reads, and audited inquiry transitions.

`pnpm verify:supabase` uses a service-only posture RPC to verify RLS is enabled and the anonymous role has no `SELECT` grant on buyer sessions, search briefs/runs, tool runs, inquiries, and audit events. It then probes each table anonymously and accepts only a response exposing no rows or an explicit authorization denial. `pnpm verify:supabase-identities` signs in two dedicated preview/staging users, creates temporary owner-scoped briefs, proves own reads and cross-owner read/insert denial, then removes the temporary rows with the server-only client. For a development-only one-off probe, set `RAMA_RLS_TEST_EPHEMERAL=true`; the verifier provisions and deletes two disposable confirmed users without printing identities or credentials. Never enable ephemeral provisioning against production.

The buyer-facing repository always uses a cookieless anonymous client, so an administrator signed into the same browser cannot make draft CRM records appear publicly.

## Current production gates

- Require leaked-password protection for production; retain the existing application password validation, rate limiting, native Supabase authentication, and staff MFA/step-up gate.
- Load licensed, provenance-complete inventory, payment schedules, floor plans, and documents.
- Set independent production `BUYER_SESSION_SECRET` and `RATE_LIMIT_SECRET` values.
- Approve retention windows, consent copy, privacy terms, advisor response expectations, and staff MFA/step-up policy.
- Run deployed browser/device/audio, hosted multi-identity RLS, backup/restore, privacy, and penetration testing.

Start with the [documentation index](./docs/DOCUMENTATION_INDEX.md). The approved product and delivery direction is [Jumping the Curve CTO Plan](./docs/JUMPING_THE_CURVE_CTO_PLAN.md); implementation evidence remains in [Enterprise Implementation Status](./docs/ENTERPRISE_IMPLEMENTATION_STATUS.md).

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

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The staff sign-in route is `/auth/sign-in`; authenticated operations are under `/dashboard`.

## Quality gates

```bash
pnpm check
pnpm verify:supabase
pnpm verify:gemini-live
```

`pnpm check` runs lint, typecheck, unit/contract tests, and the production build. The Supabase verifier uses the publishable key to confirm the governed public view and deny anonymous operational reads, then verifies the shared limiter through the server-only key. The Gemini verifier synthesizes a spoken request, opens a native Gemini Live session with an ephemeral token, executes a governed property-search tool call, returns the tool result, and confirms streamed native audio plus both transcripts.

## Buyer flow

1. The hero accepts the same property brief by text or native speech-to-speech.
2. Text calls `POST /api/discovery/query`. Gemini Live calls `POST /api/agent/tools` and owns the voice search, so one utterance produces one search.
3. Both paths use `PublicCatalogRepository`, a cookieless anonymous Supabase client, one publication predicate, one persisted buyer session, and `BuyerDecisionEnvelopeV1`.
4. The app navigates to `/discover/{searchRunId}`. Client navigation opens an intercepted editorial dialog; direct navigation and refresh render the full-page fallback.
5. The room can retrieve details, comparisons, published payment schedules, deterministic purchase scenarios, floor plans, documents, development facts, area guidance, and a consented advisor handoff.
6. A handoff is written through a narrow idempotent server RPC and appears in `/dashboard/inquiries` with audited status transitions.

The legacy `/api/property-search` route returns `410 Gone`. Production never substitutes local demo rows after a catalog error or legitimate zero-result response. Bundled samples are available only when `RAMA_DEMO_MODE=true` and remain explicitly illustrative.

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
- service-role-only operational RPCs plus role-scoped CRM reads and audited inquiry transitions.

The buyer-facing repository always uses a cookieless anonymous client, so an administrator signed into the same browser cannot make draft CRM records appear publicly.

## Current production gates

- Enable Supabase leaked-password protection in Auth settings.
- Load licensed, provenance-complete inventory, payment schedules, floor plans, and documents.
- Set independent production `BUYER_SESSION_SECRET` and `RATE_LIMIT_SECRET` values.
- Approve retention windows, consent copy, privacy terms, advisor response expectations, and staff MFA/step-up policy.
- Run deployed browser/device/audio, hosted multi-identity RLS, backup/restore, privacy, and penetration testing.

See [docs/ENTERPRISE_IMPLEMENTATION_STATUS.md](./docs/ENTERPRISE_IMPLEMENTATION_STATUS.md) for the implementation map and evidence, [docs/CTO_ARCHITECTURE.md](./docs/CTO_ARCHITECTURE.md) for the architecture, and [docs/BUYER_AI_CRM_EXPERIENCE_PLAN.md](./docs/BUYER_AI_CRM_EXPERIENCE_PLAN.md) for the reviewed product plan.

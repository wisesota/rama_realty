# Deterministic illustrative quickstart

This path proves the landing and review-before-search interaction without production credentials, a hosted database, telemetry, or a licensed inventory provider.

Prerequisites: Node.js 22 or newer and pnpm 11.20.0.

## Start

```bash
pnpm install
pnpm demo
```

Open `http://localhost:3000/en` or `http://localhost:3000/ar`. Type a Dubai property brief and choose the search action. Rama renders an editable confirmation with inferred criteria. Cancel returns to the invitation without saving anything. Confirm opens the route-backed illustrative Decision Room; refresh, Back, Forward, and direct navigation remain available for that browser while the demo process is running.

The demo command injects non-secret, process-only placeholders, enables explicitly illustrative local records, and disables Gemini Live, telemetry, durable persistence, and advisor handoff. Confirmed results are bound to the opaque browser session, kept in a bounded in-memory store for 30 minutes, and erased when the process restarts. No demo catalog request reaches Supabase. Do not use this path to evaluate hosted Auth, RLS, licensed supply, voice quality, durable restoration, or production readiness.

Expected result: a three-residence illustrative Decision Room with source boundaries, buyer-confirmed criteria, deterministic evidence cards, and a disabled advisor-handoff control. A random or expired result route returns `404` rather than disclosing another browser's result.

For connected development, copy `.env.example` to `.env.local`, supply independent values, then run `pnpm env:check`, `pnpm run doctor`, `pnpm verify:supabase`, `pnpm verify:telemetry`, and `pnpm dev`. With the server running, `pnpm verify:gemini-live` performs the native speech/tool/audio round trip. For the hosted ownership matrix, configure two dedicated disposable preview/staging Auth accounts and run `pnpm verify:supabase-identities`; do not use production identities.

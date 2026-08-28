# Environment contract

The executable contract lives in `scripts/env-contract.mjs`. `pnpm env:check` loads `.env.local`, prints key names and status only, and fails when a required key is absent, malformed, publicly exposed, or reused across security domains. It never prints values. `pnpm run doctor` adds Node, pnpm, port, and approved-provider reachability checks. The explicit `run` is required because `pnpm doctor` is a pnpm diagnostic command, not the repository script.

## Required

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `RATE_LIMIT_SECRET` | server | HMAC key for shared rate-limit buckets; independent, at least 32 characters |
| `BUYER_SESSION_SECRET` | server | HMAC key for anonymous buyer ownership and rotation; independent, at least 32 characters |
| `SUPABASE_SECRET_KEY` | server | narrow server administration/RPC client; never browser code |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | browser-safe publishable key; RLS remains authoritative |
| `NEXT_PUBLIC_SITE_URL` | public | canonical origin; HTTPS outside localhost |
| `RAMA_DEMO_MODE` | server | explicit illustrative demo switch |
| `GEMINI_LIVE_ENABLED` | server | enables/disables the Live path |
| `GEMINI_API_KEY` | server | required while Gemini voice is enabled |

## Rollout and rollback flags

`RAMA_PUBLIC_EXPERIENCE_ENABLED`, `RAMA_LANDING_COMPOSITION_ENABLED`, `RAMA_BRIEF_CONFIRMATION_ENABLED`, `RAMA_LOCALE_ROUTES_ENABLED`, `RAMA_EVIDENCE_V2_WRITER_ENABLED`, and `RAMA_EVIDENCE_V2_RENDERER_ENABLED` default to `true` when omitted. Setting a flag to `false` fails its affected path closed. The landing-composition kill switch returns a localized, non-cacheable `503` without falling back to unsupported marketing UI. Locale rollback redirects locale-prefixed public routes to the compatible legacy route. The evidence writer and renderer are independent: writer rollback stops new durable v2 events and returns v1 for new runs while the renderer can still read previously persisted v2 records; renderer rollback returns the compatible v1 envelope without disabling durable writes or reversing migrations.

`RAMA_DECISION_OS_ROLLOUT_PERCENT` accepts an integer from 0 to 100 and assigns one stable buyer cohort across query, agent-tool, Live-token, and recorded-voice routes using the server-only buyer-session HMAC domain; it never exposes the cohort secret or uses client-selected identity. Live voice retains the independent `GEMINI_LIVE_ENABLED` switch. Licensed publication requires both `LICENSED_SUPPLY_PUBLICATION_ENABLED=true` and the exact stable provider identifier in `LICENSED_SUPPLY_PROVIDER_IDS`; removing one provider ID is its individual kill switch. Application code publishes only through `publishValidatedProviderRecord`, while `provider_sources.enabled` plus current rights/freshness remain the database backstop. Malformed booleans, percentages, and provider identifier lists fail environment validation.

`RATE_LIMIT_SECRET`, `BUYER_SESSION_SECRET`, Gemini/provider keys, and the Supabase secret key must all differ. The application and hosted verifier fail closed; neither Gemini nor Supabase credentials are fallback HMAC keys.

## Optional and gated

- `GEMINI_VOICE_MODEL` controls only recorded fallback. Live remains code-pinned to `gemini-3.1-flash-live-preview`. The recorded default is `gemini-3.7-flash`.
- PostHog public configuration enables consented browser analytics. Personal API credentials are server-only. AI observation always uses privacy mode.
- Sentry DSN and client trace sample rate are public build inputs. Sentry auth and server sample rate are server-only. Default tracing is 5%; events pass the repository scrubber.
- `pnpm verify:telemetry` validates configured PostHog and Sentry credentials through read-only/bounded provider APIs and emits provider status only. It never sends a Sentry test event or prints a token, DSN, response body, or project credential.
- HouseCanary, HubSpot, and any future inventory connector remain unset until a connector profile, contract, data rights, and activation record are approved.
- `LICENSED_SUPPLY_PROVIDER_IDS` is a comma-separated allowlist of lowercase stable identifiers. An empty value keeps every provider disabled even if the global publication flag is accidentally enabled.
- `RAMA_RLS_TEST_USER_A_EMAIL/PASSWORD` and `RAMA_RLS_TEST_USER_B_EMAIL/PASSWORD` are optional private verifier inputs for two distinct disposable preview/staging Auth users. `RAMA_RLS_TEST_EPHEMERAL=true` is a development-only alternative that provisions and removes two confirmed users during a single verifier run. These values are never browser variables, production identities, or application runtime requirements.
- Firecrawl is not an approved production connector and intentionally has no repository environment contract. Revoke/remove any historical local key.

## Environments

Local may use illustrative inventory. Preview and staging must use synthetic or contractually approved data. Production requires `RAMA_DEMO_MODE=false`, licensed supply, a completed rotation log, hosted RLS verification, approved retention/consent text, and an explicit activation record. `pnpm release:contract` validates that the checked-in evidence is internally honest; `pnpm release:readiness` fails until every production approval and operational artifact in `production-activation.json` is present, every deployable public media file is registered with approved rights evidence, and the runtime cohort, enabled flags, provider IDs, release commit, and HTTPS site URL match that record. A locally green build is never production approval.

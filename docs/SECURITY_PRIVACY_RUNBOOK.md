# Security and privacy runbook

**Owner:** CTO until a named security/privacy owner accepts the role.  
**Release state:** production connector activation is blocked.

## Credential incident response

Any credential pasted into chat, an issue, a task, a screenshot, a shell command, or source is exposed even if the repository is private.

1. Revoke it at the provider.
2. Create a new least-privilege credential or OAuth grant.
3. Review provider audit logs from the first possible exposure time through revocation.
4. Remove stale sessions, tokens, webhooks, and unused integrations.
5. If committed, use a reviewed history-rewrite incident procedure and notify every clone owner.
6. Record provider, old credential identifier (never value), revocation time, replacement scope, audit result, actor, and reviewer.
7. Run `pnpm env:check`, provider-specific verification, CI, and the privacy canary before activation.
8. Populate `docs/production-activation.json` from accountable evidence, then require `pnpm release:readiness` to pass in the target production environment. It verifies demo mode is off and the actual cohort, flags, provider IDs, and HTTPS site URL match the approval. Never change its draft status merely to make the command green.
9. Keep provider and MCP credentials out of process command-line arguments. After any command-line or transcript exposure, stop the affected process, revoke and rotate the token, restart with a non-command-line credential mechanism, and review provider audit logs for the exposure window.

Required rotation scope for the current incident: Supabase, GitHub, Firecrawl, Sentry, PostHog, registry credentials, and any copied derivatives. This repository cannot prove external revocation; the release gate remains open until provider evidence is attached outside Git.

## Telemetry contracts

Allowed operational events are versioned and allowlisted in `lib/operational-telemetry.ts`:

- `voice.recorded_turn`: outcome and coarse latency bucket;
- `discovery.query`: source, outcome, coarse latency bucket, and coarse result-count bucket;
- `voice.live_stage` (schema v2): ephemeral attempt UUID, allowlisted stage/outcome, coarse latency, mode/locale, coarse browser/network class, bounded reconnect count, provider/API version, and release commit.

They use the non-person distinct identifier `rama-service` and disable person-profile creation. Live-stage ingestion is same-origin, strictly schema-validated, bounded to 2 KiB, rate-limited, and disabled unless `RAMA_OPERATIONAL_TELEMETRY_ENABLED=true`. PostHog AI privacy mode and the Sentry event scrubber are enforced in code and covered by privacy-contract tests. Hosted provider settings and the synthetic privacy canary still require current external evidence before production.

Never capture raw audio, transcript, brief, prompt, output, email, phone, cookies, authorization data, buyer/session/search/property identifiers, exact budget, or exact location in analytics or error monitoring. Browser product analytics remains consent-gated.

Default retention targets, pending a provider configuration screenshot and legal approval:

- Sentry errors/traces: 30 days;
- aggregate PostHog operational events: 90 days;
- session replay: disabled;
- raw AI input/output in PostHog: disabled by privacy mode.

## Privacy canary

Before production and after each telemetry SDK upgrade, submit synthetic canary markers through text, recorded voice, Live voice, inquiry validation, and an induced handled error. Search Sentry and PostHog for every marker. Passing evidence requires zero marker occurrences, privacy-mode tests green, and a reviewer/date. A failed canary triggers both kill switches immediately.

CI also runs `pnpm telemetry:contract`, which compares the operational allowlist with the forbidden content-field policy. The route independently rejects unknown fields and bounds the actual UTF-8 body size rather than trusting `Content-Length`. Schema expansion requires security/privacy review and a new canary artifact.

Kill switches:

- remove/blank the PostHog project token to disable capture;
- remove/blank the Sentry DSN to disable delivery;
- set `GEMINI_LIVE_ENABLED=false` to disable Live while retaining text and eligible recorded fallback;
- set `RAMA_OPERATIONAL_TELEMETRY_ENABLED=false` to stop the operational Live-stage channel;
- revoke provider keys for suspected credential misuse.

Telemetry is fail-open for buyers and fail-closed for privacy: observability failures never block discovery, but a privacy-control failure blocks release.

## Data rights and retention

The UAE Personal Data Protection Law covers electronic processing inside and outside the UAE and gives people correction and processing-restriction rights; the official UAE portal also describes deletion/forgetting and breach-notification rights. Cross-border processing needs an approved vendor/region and data-processing review. Sources: [UAE data protection overview](https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws.), [UAE legislation portal](https://uaelegislation.gov.ae/ar/legislations/1972).

Product defaults:

- audio in Rama: memory only, disposed on every exit path, never persisted by the application;
- Gemini Live session resumption: disabled by default with `GEMINI_LIVE_SESSION_RESUMPTION_ENABLED=false`; enabling it requires privacy/legal approval, buyer disclosure, provider-region/retention review, and a matching production activation record;
- anonymous buyer session and associated searches: 30 days after last activity, cascade delete unless bound to an authenticated owner or inquiry;
- authenticated saved decision records: 12 months after last activity, then deletion or irreversible aggregation;
- inquiry/contact data: 24 months after last interaction, subject to licensed partner/legal obligations;
- security/audit events: 24 months, with content minimization and protected access;
- provider logs/backups: shortest supported window, with deletion propagation documented.

The operating boundary is software decision support plus an explicit introduction to a separately licensed broker. DLD materials say licensed brokers must preserve transaction documentation; if Rama later becomes a broker, legal counsel must replace these defaults with the applicable regulated schedule. Sources: [DLD legislation](https://dubailand.gov.ae/media/gkbnktpa/legislation_en.pdf), [DLD brokerage FAQ](https://dubailand.gov.ae/en/frequently-asked-questions).

Export must include the buyer's current profile, briefs, decision records, shortlist, inquiries, consents, and human-readable provenance. Deletion must verify identity, revoke sessions, delete/cascade eligible records, propagate to processors, and return an exception list for legally retained items. Anonymous deletion uses proof of the current buyer-session token and cannot expose whether another token exists.

### Implemented data-rights boundary

- `GET /api/buyer-data` returns a deterministic `rama-buyer-export/1.0` JSON attachment. Authenticated reads are built by `export_authenticated_buyer_data` after `auth.uid()` ownership verification. Anonymous reads use only the HMAC digest of the current HttpOnly buyer cookie through a service-role-only RPC. The stored token digest is never exported.
- `DELETE /api/buyer-data` is same-origin, requires the exact phrase `DELETE MY RAMA DATA`, and calls one database erasure function before touching Auth state. Authenticated deletion first sends a magic link only to the verified email on the current account. The callback consumes the initiating-browser challenge and mints a ten-minute, one-time authorization bound to the new Auth `session_id`; the erasure RPC consumes that authorization atomically. A routine access-token refresh cannot satisfy this step-up. Successful deletion revokes all login sessions and removes the non-staff Auth user. Any account with an organization membership or ownership is blocked for administrator review.
- Eligible buyer data is removed transactionally. Inquiry destinations and the stable internal inquiry UUID needed to address processor records are copied into the service-only `private.processor_deletion_outbox` before the inquiry and CRM outbox cascade. A processor-native identifier can be attached as `processor_record_id` when a licensed connector returns one. The response lists external destinations that still require processor confirmation and every minimized audit exception with its reason and expiry.
- `claim_processor_deletion_jobs`, `complete_processor_deletion_job`, and `fail_processor_deletion_job` form a service-role-only fenced lease protocol. Each row stores its own expiry and unique lease token; terminal writes require that token, exhausted/crashed attempts become durable failures, and a later claimant cannot shorten an active lease. The worker starts a bounded claimed batch concurrently, gives every approved adapter an abort signal and a deadline shorter than the lease, validates bounded output, and treats an absent adapter as a retryable failure. Adapters must implement idempotent deletion and must never receive arbitrary destinations through a generic URL fetcher.
- A privacy request remains `processor_pending` while any external deletion is nonterminal. Only the final `delivered` or `not_required` transition marks it completed and begins its 24-month evidence window. Subject-scoped advisory transaction locks prevent concurrent requests from queuing the same processor record twice.
- Privacy-request evidence, processor work, and successful retention-run evidence are private, service-only, content-minimized, and expire 24 months after terminal completion under the current software default; unresolved work is preserved.

The route reports partial completion explicitly. If application erasure succeeds but Auth revocation or Auth-user deletion fails, it returns a failing response with the privacy request ID; operations must complete the remaining Auth action rather than asking the buyer to assume it succeeded.

### Retention operation

`enforce_buyer_data_retention` is service-role-only and defaults to a dry run. It evaluates anonymous sessions at 30 days, authenticated decision sessions/saved briefs/shortlist at 12 months, and inquiries at 24 months. It rejects materially future-dated `as_of` values, queues actionable processor deletion before removing expired inquiries, and records the counts in `private.data_retention_runs`. Unresolved processor work (`pending`, `processing`, or `failed`) is never age-deleted; only `delivered` or `not_required` rows are removed after 24 months from `completed_at`.

Run a dry evaluation first:

```sql
select public.enforce_buyer_data_retention(false, now());
```

Production scheduling is intentionally absent. Legal approval, a reviewed hosted migration, a dry-run count review, an approved destination adapter plus scheduler/alert ownership, backup-deletion documentation, and a successful multi-identity test are required before an operator may run:

```sql
select public.enforce_buyer_data_retention(true, now());
```

## Escalation

- Privacy leak or active credential abuse: disable the affected provider, revoke credentials, preserve audit evidence, notify the CTO immediately, and begin the legal notification assessment.
- Catalog/source-rights uncertainty: unpublish affected records and disable handoff.
- Telemetry payload uncertainty: disable telemetry, do not sample around the problem.
- Supabase/RLS uncertainty: disable the affected write/read path until hosted multi-identity verification passes.

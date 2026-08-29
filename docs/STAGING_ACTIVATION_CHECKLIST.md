# Staging activation checklist

**Owner:** CTO / release owner  
**State:** blocked until a dedicated Supabase project and HTTPS application target exist  
**Policy:** development evidence never substitutes for staging evidence

## Provision once

- [ ] Create a dedicated Supabase staging project; do not reuse development or production.
- [ ] Create an HTTPS application deployment connected only to the staging project.
- [ ] Configure `RAMA_STAGING_URL`, exact `RAMA_RELEASE_COMMIT`, staging Supabase URL/publishable/secret keys, independent `RATE_LIMIT_SECRET` and `BUYER_SESSION_SECRET`, Gemini, Sentry, and PostHog credentials in protected staging environments.
- [ ] Keep service-role, Gemini, Sentry auth, and PostHog personal/project keys server-only.
- [ ] Record target project IDs and the deployment URL in the private release record, never in this repository.
- [ ] Obtain the signed media-rights approval described in `ASSET_LEGAL_REVIEW_PACKET.md` before exposing generated editorial media.

## Verify every release candidate

1. Check out the exact candidate SHA only after its isolated-store `dependency-integrity` job and full quality job pass. Require the hashed CI build attestation, `pnpm release:candidate`, deployment of that SHA, and `pnpm verify:deployment` against the no-cache release health endpoint before accepting any later evidence.
2. Replay every file under `supabase/migrations` into a clean staging database and record the ordered migration list, timestamps, target project ID, and result. Inspect explicit Data API grants as well as RLS on every exposed table, view, and function; do not infer exposure from RLS alone.
3. Run `pnpm verify:supabase` and `pnpm verify:supabase-identities` with disposable staging identities; verify cleanup removes every temporary user and row.
4. Run the provider reconciliation drill with publication disabled unless signed licensed rights exist.
5. Restore the database backup into an isolated disposable target and verify row counts plus RLS/grants. Verify Storage-object backup/restore separately because database backups do not include Storage objects. Record measured RPO/RTO, then destroy the restore targets.
6. Run the privacy canary and confirm no raw brief, transcript, email, phone, token, secret, buyer/session ID, or exact property criteria reaches telemetry.
7. Run the protected `staging-live-provider` job. It must produce two privacy-safe speech/tool/audio runs bound to the exact release SHA; raw transcripts and audio are not evidence artifacts.
8. Execute the controlled voice lab matrix and require `pnpm verify:voice-reliability -- --input <artifact>` to pass. The two protected CI runs prove entitlement only; the lab artifact supplies 100+ cross-browser/device/network/locale and injected-failure runs.
9. Exercise the per-origin and global daily application budgets, then verify provider-native Gemini quota/budget alerts and the key/feature-flag kill switch with a named operator.
10. Run `RAMA_STAGING_URL=https://… RAMA_RELEASE_COMMIT=<sha> pnpm e2e:staging` against the deployed application.
11. Capture the Git commit, deployment ID, Supabase project ID, test counts, artifact hashes, and named approvers in the environment-bound evidence bundle.

## Release rule

Staging passes only when every check above has current target-environment evidence. A missing URL, project, credential owner, legal approval, migration replay, two-user isolation run, restore drill, privacy canary, or deployed E2E result keeps `states.staging.status` at `not_verified`.

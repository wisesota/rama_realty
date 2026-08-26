# Staging activation checklist

**Owner:** CTO / release owner  
**State:** blocked until a dedicated Supabase project and HTTPS application target exist  
**Policy:** development evidence never substitutes for staging evidence

## Provision once

- [ ] Create a dedicated Supabase staging project; do not reuse development or production.
- [ ] Create an HTTPS application deployment connected only to the staging project.
- [ ] Configure `RAMA_STAGING_URL`, staging Supabase URL/publishable/secret keys, independent `RATE_LIMIT_SECRET` and `BUYER_SESSION_SECRET`, Gemini, Sentry, and PostHog credentials in the staging environment.
- [ ] Keep service-role, Gemini, Sentry auth, and PostHog personal/project keys server-only.
- [ ] Record target project IDs and the deployment URL in the private release record, never in this repository.
- [ ] Obtain the signed media-rights approval described in `ASSET_LEGAL_REVIEW_PACKET.md` before exposing generated editorial media.

## Verify every release candidate

1. Replay every file under `supabase/migrations` into a clean staging database and record the ordered migration list, timestamps, target project ID, and result.
2. Run `pnpm verify:supabase` and `pnpm verify:supabase-identities` with disposable staging identities; verify cleanup removes every temporary user and row.
3. Run the provider reconciliation drill with publication disabled unless signed licensed rights exist.
4. Create an encrypted staging backup, restore it into an isolated disposable target, verify row counts and RLS posture, then destroy the disposable restore target.
5. Run the privacy canary and confirm no raw brief, transcript, email, phone, token, or secret reaches telemetry.
6. Run `RAMA_STAGING_URL=https://… pnpm e2e:staging` against the deployed application.
7. Capture the Git commit, deployment ID, Supabase project ID, test counts, artifact hashes, and named approvers in the environment-bound evidence bundle.

## Release rule

Staging passes only when every check above has current target-environment evidence. A missing URL, project, credential owner, legal approval, migration replay, two-user isolation run, restore drill, privacy canary, or deployed E2E result keeps `states.staging.status` at `not_verified`.

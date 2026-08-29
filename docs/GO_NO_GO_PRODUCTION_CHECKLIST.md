# Production go/no-go checklist

Production is a no-go unless every hard gate below has current, environment-bound evidence for the exact release commit. Local test output is supporting evidence, not a substitute for hosted, legal, human, or pilot evidence.

## Hard gates

| Gate | Accountable owner | Required evidence | Fastest safe path |
| --- | --- | --- | --- |
| Licensed inventory provider | Commercial/legal | signed agreement, permitted fields/territories, data freshness SLA, takedown path, provider ID, and reconciliation run | Run contract, technical sandbox, and field-rights mapping in parallel; keep publication disabled until all three converge. |
| Documentary asset rights | Legal/brand | signed review artifact bound to the 22-file hash inventory and release SHA | Review only the deployable register; do not send the retired exploration archive unless a file is proposed for reinstatement. |
| Hosted RLS, backups, and alerts | Security/operations | clean migration replay, explicit grants plus RLS matrix, two-identity isolation, database restore, separate Storage restore, measured RPO/RTO, alert delivery drill | Use a disposable staging project/restore target and one dated evidence bundle; capture failures as blockers rather than screenshots without assertions. |
| Assistive technology | Accessibility owner | representative VoiceOver/Safari and NVDA/Firefox or JAWS/Chrome results, EN/AR keyboard/focus/announcement matrix, named tester, defects and dispositions | Book testers now; supply a scripted critical journey and exact candidate URL, not a generic exploratory brief. |
| Pilot evidence | Product/operations | consented cohort definition, completion and fallback rates, stage-latency distributions, support incidents, advisor feedback, stop criteria | Start with a small internal/partner cohort behind a kill switch; predefine success/failure thresholds before observing results. |
| Activation sign-off | CTO plus security/privacy/legal/product | approved `production-activation.json`, immutable evidence URIs/hashes, exact commit, cohort, flags, provider IDs, rollback/on-call/incident owners | Hold the meeting only after a 24-hour evidence freeze and a dry-run of `pnpm release:readiness` in the production environment. |

## Required meeting packet

- Exact candidate SHA and deployment attestation from `/api/health/release`.
- Clean-tree candidate result, clean-cache CI build, test/build/browser results, dependency audit, and privacy-safe Gemini Live provider artifact for that SHA. Authoritative artifacts are CI/device-lab generated; local output is diagnostic only.
- P50/P75/P95/P99 voice-stage evidence, success/error/fallback rates, and profile coverage validated against `voice-reliability-policy.json`; two connected provider runs prove entitlement only and are not an SLO.
- At least 20 controlled performance runs with cold/warm separation plus hosted RUM; the current five-run medians are preliminary.
- Asset-rights approval, licensed-provider contract, hosted RLS/grants matrix, database and Storage restore evidence, alert drill, privacy canary, assistive-technology report, and pilot report.
- Named primary and secondary on-call, incident commander, rollback owner, independent rollback approver, privacy owner, accessibility owner, provider owner, release scribe, kill-switch rehearsal, initial rollout cohort, abort thresholds, and customer-support wording.
- Application per-origin/global daily voice budgets plus provider-native quota/budget alerts, alert recipient, and tested shutdown procedure.

## Automatic no-go conditions

- Evidence targets a different commit, environment, project, or provider configuration.
- Any approval is verbal, undated, unauthenticated, stale, or lacks an immutable artifact hash.
- Session resumption, operational telemetry, licensed publication, demo mode, provider IDs, rollout percentage, or release SHA differs from the activation record.
- Raw audio, transcript, contact data, secret, buyer/session identifier, or exact property criteria appears in analytics/error monitoring.
- The shared rate limiter, hosted ownership isolation, backup restore, alert delivery, fallback path, or rollback rehearsal fails.
- Pilot or accessibility severity-one defects remain open, or production SLOs are inferred from the two-run provider check or five-run local median.
- The isolated-store dependency-integrity job, exact-SHA clean build, CI build attestation, or lockfile SHA is missing, failed, rerun against a different commit, or older than 24 hours.
- Any required CI job is flaky, manually overridden, or has a failed/cancelled attempt after the accepted attempt without a documented disposition.
- The 100-turn voice contract is missing a required real-browser/device/network/locale profile, falls below 98% live-provider success, exceeds 2% unexpected fallback, or violates its P95/P99 stage budgets.
- Provider-native quota/budget alerts lack a named recipient, fail delivery, or disagree with the approved application daily-session cap.
- A Sev-1 or Sev-2 security, privacy, accessibility, data-integrity, or voice-reliability defect is open; a required penetration-test finding lacks disposition; or the incident/rollback rehearsal fails.
- The 24-hour evidence freeze is broken by code, dependency, migration, runtime-flag, provider, Supabase-project, cohort, or artifact changes.

The meeting decision is recorded as go, conditional no-go, or no-go. “Conditional go” is not an activation state: unmet hard gates keep the machine-readable record in draft and the runtime flags off.

Update each `production-activation.json` workstream continuously when an owner accepts it, evidence changes, or status changes. Do not batch-fill it before the meeting. Any workstream without a named owner, timestamp within 24 hours, immutable HTTPS evidence URI, SHA-256, and completed evidence state cancels the meeting automatically. The meeting is not scheduled until every named operational role is filled and the primary/secondary on-call handoff is acknowledged.

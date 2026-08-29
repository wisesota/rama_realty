# External gate execution board

External work begins in parallel while CI is repaired. Final acceptance still binds every artifact to the exact release SHA and production configuration.

| Lane | Start now | Dependency before final acceptance | Accountable role | Exit evidence |
| --- | --- | --- | --- | --- |
| Hosted Supabase operations | Provision staging and restore targets; inventory grants, RLS policies, backups, alert routes, and Storage buckets | Exact RC migration replay and deployed identity matrix | Security/operations owner | migration log; explicit-grant/RLS assertions; two-identity isolation; separate database and Storage restore reports with measured RPO/RTO; alert-delivery drill; immutable bundle hash |
| Licensed provider | Complete contract/territory/field-rights mapping and sandbox adapter work with publication disabled | Signed agreement, approved provider ID, exact RC reconciliation, freshness/takedown tests | Commercial/legal owner plus provider owner | agreement reference; field map; sandbox reconciliation result; quota/failure drill; publication flag remains false until approval |
| Asset rights | Review the 22-file deployable hash inventory | Final manifest hash and RC SHA | Legal/brand owner | signed per-file disposition bound to `docs/PUBLIC_ASSET_RIGHTS.json` hash; unresolved files remain non-deployable |
| Privacy and retention | Draft consent, retention, processor-deletion, telemetry, and Gemini session-resumption decisions | Exact provider settings and approved production data flow | Privacy owner | signed retention decision; processor/subprocessor list; deletion test; privacy canary; explicit resumption decision |
| Assistive technology | Book representative testers and approve EN/AR journey scripts | Stable staging URL at exact RC SHA for execution | Accessibility owner | VoiceOver/Safari and NVDA/Firefox or JAWS/Chrome report; mobile screen-reader result; keyboard/focus/announcement matrix; defect disposition |
| Pilot | Define consented cohort, support scripts, abort thresholds, and analysis template | Verified staging candidate, legal/privacy clearance, kill-switch rehearsal | Product/operations owner | cohort record; completion/error/fallback/latency report; support incidents; advisor feedback; stop/go disposition |
| Activation | Reserve on-call window and assign decision roles | Every lane complete, 24-hour evidence freeze, clean CI attestation | CTO and release scribe | approved activation record; meeting minutes; rollback authorization; initial cohort and abort thresholds |

## Coordination cadence

- Each lane updates `docs/production-activation.json` when an owner accepts it, evidence changes, or status changes. A completed lane needs owner, fresh `updatedAt`, immutable HTTPS evidence URI, and SHA-256.
- Hold a 15-minute daily blocker review. Escalate dependency/booking delays after one business day; do not convert waiting into a code workaround.
- Hosted provisioning, legal intake, provider sandbox work, privacy drafting, tester scheduling, and pilot design can start immediately. Actual AT execution, pilot execution, final RLS replay, and final reconciliation wait for the immutable staging SHA.
- Publication, production voice, and session resumption remain disabled until their respective gates are approved.

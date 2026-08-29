# CTO plan completion matrix

This is the requirement-by-requirement audit for `JUMPING_THE_CURVE_CTO_PLAN`. A green local build proves only repository behavior. It does not close credential, legal, provider, hosted, device, or pilot gates.

The current source-level reconciliation, security remediations, failure modes, and test map are recorded in [`CTO_PLAN_PENDING_TASK_AUDIT.md`](./CTO_PLAN_PENDING_TASK_AUDIT.md).

| Phase | Repository evidence | Current conclusion | Evidence still required |
| --- | --- | --- | --- |
| 0 | privacy-safe envelopes, Sentry scrubber, data-rights migration/API, CI, env preflight, audit; rotated MCP credentials moved from process arguments to environment-backed direct HTTP headers | Repository controls complete; MCP credential leak resolved; gate open | provider audit-log review and hosted privacy canary |
| 1 | operating thesis, narrow AED 2M-15M cross-border wedge, claims registry, provider feasibility profile | Hypothesis selected; gate open | buyer/advisor research, partner, legal/commercial approval |
| 2 | locale routes, EN/AR/RTL, truth-led landing, confirmation UI, 320/390/768/1024/1280/1440 responsive E2E, compatible locale-route rollback, exact public-asset register, five-run mobile Fast 3G median LCP 2188 ms | Repository slice complete; preliminary local median passes | 20-run P75/P95 capture, hosted RUM, documentary rights/legal approval, and assistive-technology device evidence |
| 3 | prepare/review/confirm route, idempotent RPC, canonical locale Decision Room, parity tests, buyer-bound demo restoration, and passing development multi-identity/RLS execution | Development slice verified | repeat the identity matrix in deployed staging |
| 4 | constrained token, VAD, barge-in, two-attempt resumption, GoAway scheduling, accepted/late socket lifecycle, stage deadlines, eight-minute cap, fallback, and privacy-safe staged telemetry | Implementation and connected single-turn contract verified; gate open | representative-device/network P50/P95 baseline and real failure matrix |
| 5 | evidence vocabulary, immutable snapshots, v1/v2 reader, current/as-seen differences, ledger, deterministic scenarios, independent writer/renderer rollback, and applied development migrations | Development slice verified | deployed staging shadow validation |
| 6 | quarantine/validation/publication contracts, global gate, and per-provider kill switch | Deliberately disabled | signed licensed rights, staging data, hosted provider/reconciliation evidence |
| 7 | scrubbed telemetry, advisor feedback, export/deletion, leased processor-erasure worker core | Repository slice complete | approved processor adapter, hosted privacy canary, named incident/on-call owners |
| 8 | deterministic information-gain questions, saved criteria, cross-run comparison, bilingual fixtures, localized presentation checks, and text/voice route parity | Deterministic repository harness and interaction slice complete; gate open | live model/prompt evaluation for source use, locale quality, clarification, refusal/escalation, and a real buyer/advisor pilot across both locales |

## Authentication architecture decision — 23 August 2026

Rama uses native Supabase authentication only:

- staff authenticate with Supabase email and password through `signInWithPassword`;
- buyers authenticate with Supabase email links through `signInWithOtp`;
- `/auth/callback` accepts only the explicit `saved-brief` and `buyer-deletion` email-link purposes;
- Google OAuth UI, provider invocation, and generic provider callback behavior are absent; and
- the hosted Supabase Google provider is disabled.

The OAuth-era buyer-session audit reason was migrated to the provider-neutral `auth_callback` value without discarding historical tombstones. Source, SQL, unit/contract, and browser tests enforce this boundary.

## Security-block status — 23 August 2026

| Block | Status | Verification |
| --- | --- | --- |
| Rotated MCP credentials | Resolved | Supabase and PostHog now use environment-backed direct HTTP authorization headers; all six MCP definitions parse with exactly one transport, no configured credential remains in `args`, no rotated value appears in a running process command line, and authenticated `initialize` calls returned HTTP 200. |
| Google authentication | Resolved | Application contract is native Supabase-only and hosted `external_google_enabled` is `false`. |
| Supabase leaked-password protection | Application HIBP implementation | Enabling `password_hibp_enabled` returned HTTP 402 on the Free organization. The CTO decision is to remain on Supabase Free, so this paid control is removed from the infrastructure configuration, and leaked-password protection has been implemented instead at the application edge using the Have I Been Pwned API. Existing password validation, rate limiting, native Supabase authentication, and the staff MFA/step-up gate remain required. |
| Staging deployment | Not provisioned | The organization has no staging project or Supabase branch, and the repository has no linked hosting project or staging URL. Creation remains subject to the provider cost-confirmation and target-environment gates. |

Once a staging URL exists, `RAMA_STAGING_URL=https://… pnpm e2e:staging` runs the deployed HTTPS matrix without starting local Next.js or Storybook servers. The suite checks EN/AR, native-only staff auth, provider-callback rejection, mobile RTL/overflow/reduced motion, and a persisted Decision Room round trip.

## Pre-staging product audit — 23 August 2026

The local product, UI/UX, and functional audit is complete. The seven blocking findings identified during the first live review are closed:

| Finding | Resolution |
| --- | --- |
| Arabic Decision Room mixed Rama-owned English copy | Localized decision chrome, evidence vocabulary, units, governed tool actions, advisor handoff, inline voice follow-up, restoration notices, and ledger summaries. Source property names remain unchanged. |
| Short briefs failed without visible guidance | Added a focused alert, `aria-invalid`, descriptive relationships, and a retryable recovery state. |
| Voice was visually subordinate to typed search | Made voice the first and strongest hero interaction; typed entry is the secondary review path. |
| Mobile navigation duplicated actions and exposed staff concerns | Reduced the mobile menu to the buyer journey, decision method, and language switch. Staff access remains outside public buyer navigation. |
| Prefilled example looked buyer-owned | First visit is empty; the example is placeholder guidance only. |
| Buyer export lacked observable completion | Added progress and completion states plus a buyer-bound in-memory demo export and deletion path. |
| Governance copy was repetitive and evidence values were raw | Tightened trust copy and localized/formatted source states, units, and evidence values. |

The regression loop also closed header/mobile link contrast, the 390px field-width breakpoint, the demo export's hosted-Supabase dependency, consent-safe analytics URLs, Next 16 Sentry conventions, and eager hydration of the working voice surface. Current source evidence is 64 unit/contract files with 290 passing tests and 39/39 Chromium E2E scenarios, with no horizontal overflow at the audited viewports and zero active token-policy findings. The authoritative clean build is currently open: cache cleaning exposed mutated pnpm store entries on this host, and registry refetch failed during a network outage. The earlier 30-route build predates the final limiter migration/spend-cap slice and is not release evidence. A fresh CI runner must reproduce the clean build before this local functional/design slice can be called release-candidate ready.

The earlier Lighthouse record remains in [`performance-baseline.json`](./performance-baseline.json). The current five-run production-server CDP record is [`performance-voice-hardening.json`](./performance-voice-hardening.json): desktop median LCP is 708 ms with CLS 0.0023; mobile Fast 3G under 4x CPU slowdown has median LCP 2188 ms with CLS 0. The heading is the measured LCP element. This is encouraging but underpowered: the desktop set contains a 2340 ms cold outlier and five samples cannot establish P75/P95 or a production SLO. The capture tool now defaults to 20 runs and reports median/P75/P95 plus cold-candidate and warm-repeat records. Hosted field data and representative-device evidence remain open.

## Completion rule

The full objective is not achieved while any plan gate above remains open. Production activation also requires persistent production secrets, preview/staging evidence, backup restoration, independent penetration testing, and an explicit activation record. `pnpm release:contract` proves only that the checked-in evidence is internally consistent; `pnpm release:readiness` must remain red until every production gate is proven. The executable work-package record is [`cto-work-packages.json`](./cto-work-packages.json); release state remains in [`release-evidence.json`](./release-evidence.json), and the activation gate consumes [`production-activation.json`](./production-activation.json).

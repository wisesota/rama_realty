# CTO plan and pending-task audit

**Audit date:** 25 August 2026  
**Scope:** `JUMPING_THE_CURVE_CTO_PLAN`, work packages P0-P8, current source, migrations, tests, release contracts, and documentation  
**Decision owner:** CTO under delegated product authority  
**Conclusion:** the approved feature, security, observability, token, registry, and staging-harness work is implemented or fails closed. One measured repository release gate remains open: mobile Fast 3G LCP is 3997.29 ms against the 2500 ms target. External staging, legal, provider, backup, device, pilot, and activation evidence also remains open and must not be simulated or relabelled as complete.

## Executive decision

Keep the governed voice-first Dubai Buyer Decision OS direction. Current market evidence still supports the wedge: DLD reported AED 252 billion of Q1 2026 activity and AED 148.35 billion of foreign investment, while CBRE reported more than 45,000 residential transactions worth AED 137 billion alongside moderating growth and cautious investors. Knight Frank reported that off-plan sales remained 72% of Q1 residential transactions. Those conditions reward source freshness, delivery-state clarity, scenario review, and a durable Decision Ledger more than another inventory gallery or generic AI search box.

Primary sources: [DLD Q1 2026](https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026), [CBRE Q1 2026](https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q1-2026), and [Knight Frank Q1 2026](https://www.knightfrank.ae/site-assets/pdf/2026/dubai-residential-market-review-q1-2026.pdf).

## What already exists

```text
spoken or typed brief
  -> side-effect-free prepared brief
  -> buyer review/edit/confirm
  -> idempotent governed discovery
  -> Supabase-owned search run + evidence snapshot
  -> locale-aware Decision Room
  -> eligible, consented licensed-advisor handoff

provider record
  -> private quarantine
  -> contract + rights + freshness validation
  -> server publication allowlist
  -> service-role publication RPC
  -> public catalog predicate
  -> automatic withdrawal when source rights close
```

The repository includes independent rollout flags, credential-free illustrative demo restoration, EN/AR locale routes, RTL and responsive E2E coverage, v1/v2 evidence compatibility, provider quarantine and reconciliation, buyer export/deletion, processor-erasure leasing, privacy-safe telemetry, release evidence, and a fail-closed production activation contract.

## Requirement-by-requirement result

| Package | Repository conclusion | Locally actionable work | Gate that remains open |
| --- | --- | --- | --- |
| P0 | Complete and locally verified | None | production credential rotation record, provider audit-log review, hosted privacy canary |
| P1 | Operating thesis and claims boundary complete | None | buyer/advisor interviews, partner selection, legal/commercial approval |
| P2 | Locale, truth-led landing, assets register, responsive/RTL harness, interaction-loaded composer, zero active token findings, and five-run performance harness complete | Continue mobile LCP optimization; current median is 3997.29 ms against 2500 ms | documentary asset rights and assistive-technology device evidence |
| P3 | Prepare/review/confirm, idempotency, route restoration, and ownership contracts complete; development two-identity/RLS execution passed | None | repeat the identity matrix in deployed staging |
| P4 | Live/recorded/text resilience and bounded telemetry complete | None | representative-device and network P50/P95 baseline plus failure matrix |
| P5 | Evidence v2, snapshots, ledger, current/as-seen differences, and rollback complete; development migrations are applied | None | deployed staging v1/v2 shadow validation |
| P6 | Publication boundary complete and deliberately disabled | None without a licensed provider | signed rights, approved provider, hosted staging/reconciliation and activation evidence |
| P7 | Data rights, telemetry, feedback, and processor-erasure worker core complete | None without an approved processor | processor adapter certification, scheduler/alerts, privacy canary, named incident/on-call owners |
| P8 | Deterministic bilingual harness, clarification ordering, saved criteria, comparison, and route parity complete | None that can substitute for real evaluation | live model/prompt evaluation and a buyer/advisor pilot in both locales |

## Verified remediation of audit findings

The current tree already contains the fixes for the issues found during the adversarial review:

1. Production evidence artifacts have policy-specific maximum ages and reject future timestamps in `scripts/release-readiness-lib.mjs`, with stale/future negative tests.
2. Provider publication rejects out-of-order revisions, preserves monotonic source truth, caps publication by rights and source freshness, withdraws rows when provider rights close, and records reconciliation events.
3. Provider updates use a transaction-local audited publication path while ordinary published-content edits still require a return to review.
4. The deployment-wide provider switch and exact provider allowlist are enforced before the sole server publication RPC is called.
5. Buyer inquiry creation, authenticated deletion, anonymous deletion, and retention share the global erasure transaction lock, preventing a handoff from escaping a deletion snapshot.
6. Inquiry audit retention deletes by age before/after pseudonymization, so minimized rows do not become immortal.
7. Optional advisor outcomes normalize blank strings to `NULL`; confirmation RPCs reject null idempotency keys.
8. Provider validation and SQL catalog constraints agree on enums, integer bounds, descriptions, URLs, slugs, and published facts.
9. Generated database types include the new foreign-key relationship metadata.
10. Text and voice preparation are compared through their actual route/tool entry points after normalizing transport-only fields.

## Error and rescue registry

| Failure | System behavior | Buyer/operator result | Evidence |
| --- | --- | --- | --- |
| Missing local app-owned secrets | environment contract fails before build | developer receives the missing key name, never its value | `pnpm env:check` |
| Rate limiter unavailable | production mutation fails closed | bounded `503`, no unmetered write | route tests and shared limiter contract |
| Catalog unavailable | no illustrative substitution in connected mode | truthful unavailable state | discovery route tests |
| Duplicate confirmation/retry | database idempotency reuses the run | one result route and one persisted side effect | confirmation migration tests |
| Stale/out-of-order provider revision | publication is rejected and reconciled | older facts cannot replace newer facts | provider migration tests |
| Provider rights revoked | current source rows are withdrawn | no ineligible public or advisor path | provider source trigger contract |
| Buyer deletion races with handoff/retention | shared transaction lock serializes producers | no orphaned inquiry PII or missed processor job | buyer-data SQL tests |
| Processor deletion adapter missing/fails | leased job remains durable and retryable | request remains `processor_pending` | worker tests and runbook |
| Telemetry backend fails | product remains usable, payload remains allowlisted | no buyer-facing outage and no raw content fallback | privacy/telemetry tests |
| Production evidence absent or stale | release readiness fails closed | activation remains unauthorized | release-readiness tests |

## Failure modes registry

| Failure mode | Severity | Current control | Remaining proof |
| --- | --- | --- | --- |
| Cross-owner data exposure | Critical | JWT/RLS ownership contracts and a passing development two-user verifier | repeat in deployed staging |
| Raw brief/transcript/PII in telemetry | Critical | allowlisted envelopes and scrubbers | hosted privacy canary |
| Unlicensed or stale inventory becomes public | Critical | quarantine, rights/freshness checks, kill switches, withdrawal trigger | licensed provider staging drill |
| Duplicate buyer or CRM side effect | High | idempotency keys, row locks, unique constraints | hosted concurrency verification |
| Deletion succeeds locally but not at a processor | High | durable fenced outbox and partial-completion response | certified adapter and alert ownership |
| Voice quality or latency fails on real devices | High | bounded fallback/resumption/session cap | representative-device P50/P95 matrix |
| Unsupported product claim ships | High | claims registry and exact asset register | legal/content sign-off |
| Evidence or approvals are stale | High | time-bounded artifact validation | target-environment evidence bundle |

## Test coverage map

```text
brief capture
  -> unit extraction/contradiction/advisory-boundary fixtures
  -> real prepare-route versus voice-tool parity
  -> Playwright confirmation, keyboard, RTL, reduced-motion flows

confirmed discovery
  -> route origin/rate-limit/rollout tests
  -> SQL idempotency and ownership assertions
  -> envelope/provenance/current-vs-snapshot contract tests

provider publication
  -> TypeScript validation tests
  -> server kill-switch/RPC boundary tests
  -> migration monotonicity, rights, freshness, and withdrawal tests

data rights
  -> route and step-up callback tests
  -> SQL ordering/locking/retention tests
  -> processor lease/fencing/adapter tests

release
  -> environment contract
  -> evidence and activation schema tests
  -> stale/future evidence negative tests
  -> production build
```

SQL-text and PGlite checks remain local guards. They do not replace hosted Supabase migration, RLS, Auth, backup, or concurrency evidence.

The initial 22 August 2026 hosted posture probe failed closed with `404 PGRST202`. After identifying the sole project as the active development database, the six missing plan migrations and `20260822211710_harden_private_trigger_function_privileges.sql` were applied transactionally. The posture RPC and ephemeral two-user isolation matrix then passed; cleanup verification found zero temporary users and zero temporary briefs. This is development evidence only, not staging or production approval.

## Developer and operator experience

The credential-free `pnpm demo` path remains the developer first run. `pnpm doctor`, `pnpm env:check`, the documentation index, environment contract, connector profiles, and fail-closed release commands make local state understandable without printing secrets. Connected verification is intentionally separate because it needs real Supabase/Gemini projects and disposable test identities.

The main remaining DX issue is operational, not code: preview/staging deployment, dedicated CI identities, and evidence owners must be provisioned before development proof can become repeatable release evidence.

## Decision audit trail

| # | Decision | Classification | Rationale | Rejected |
| --- | --- | --- | --- | --- |
| 1 | Keep Option A and the Decision Ledger wedge | Strategic confirmation | refreshed primary market sources still show off-plan dominance, moderation, and foreign-buyer demand | portal clone or voice-only gallery |
| 2 | Treat all repository packages as locally complete | Evidence-based | current source, tests, migrations, and full build cover their declared implementation scope | inventing new local work to make the backlog look active |
| 3 | Keep production readiness red | Security/operations | legal, provider, hosted, device, pilot, and credential-rotation evidence is absent | self-attested production approval |
| 4 | Continue with independent throwaway local secrets | Reversible local choice | local development is unblocked while production rotation stays mandatory | reusing local values at launch |
| 5 | Do not activate licensed supply or processor adapters | One-way risk boundary | no approved provider or processor contract exists | placeholder production integrations |

## NOT in scope for local implementation

- Rotating or revoking provider credentials without the provider account owners and audit records.
- Enabling production rollout flags, demo-off production mode, or a licensed provider.
- Signing legal, data-rights, media-rights, brokerage, processor, or commercial approvals.
- Fabricating interview, pilot, screen-reader, device/audio, backup/restore, privacy-canary, penetration-test, or hosted-RLS evidence.
- Deploying the application, merging, pushing, enabling production flags, or changing paid/production infrastructure.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | ---: | --- | --- |
| CEO Review | `/plan-ceo-review` via plan audit | Product and market thesis | 2 | `CLEAR` | Option A remains the strongest wedge; external validation remains explicit |
| Eng Review | `/plan-eng-review` via plan audit | Architecture, data flow, tests | 2 | `CLEAR (LOCAL)` | Current tree contains the reported concurrency, publication, evidence-age, and typing fixes |
| Design Review | `/plan-design-review` via plan audit | UI states, accessibility, RTL | 2 | `CLEAR (REPOSITORY)` | Automated responsive/RTL/state coverage exists; real assistive-device and asset-rights evidence remains open |
| DX Review | `/plan-devex-review` via plan audit | First run and operations | 2 | `CLEAR (LOCAL)` | Credential-free demo and diagnostics exist; hosted test identities and owners remain external |
| Security Review | `/cso` via plan audit | Secrets, auth, supply chain, privacy | 3 | `CLEAR (DEVELOPMENT) / PRODUCTION BLOCKED` | Development migrations, RLS posture, ACLs, and two-user isolation pass. Leaked-password protection is intentionally excluded under the Supabase Free-plan decision; hosted production evidence remains open. |

**VERDICT:** Feature implementation is complete for P0-P8 and locally verified, but release readiness remains red for the measured mobile LCP gate as well as the external evidence listed above. Production remains unauthorized until every item is real, current, reviewed, and bound to the release commit.

NO UNRESOLVED DECISIONS

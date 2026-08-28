# Documentation index

Rama Realty is the governed voice-first Dubai Buyer Decision OS. The repository is the implementation source of truth; generated design artifacts and illustrative inventory are never treated as production evidence.

## Repository governance

- [README](../README.md) — product boundary, stack, first run, quality gates, buyer flow, and production gates.
- [AGENTS](../AGENTS.md) — binding engineering, product, design, pnpm, skill-routing, and verification contract.
- [PRODUCT](../PRODUCT.md) — product-level context retained in the checkout.
- [CLAUDE](../CLAUDE.md) — compatibility instructions for other coding-agent environments; it does not override `AGENTS.md`.

## Product and decisions

- [Jumping the Curve CTO Plan](./JUMPING_THE_CURVE_CTO_PLAN.md) — approved product identity, market evidence, phased delivery, gates, and risk register.
- [Phase 1 operating thesis](./PHASE_1_OPERATING_THESIS.md) — ICP, distribution and licensed-supply hypothesis, advisory boundary, and pilot scorecard.
- [Claims registry](./CLAIMS_REGISTRY.md) — approved, rejected, and evidence-gated public statements.
- [Buyer AI and CRM plan](./BUYER_AI_CRM_EXPERIENCE_PLAN.md) — historical reviewed product plan.

## Architecture and operations

- [Deterministic demo quickstart](./QUICKSTART.md) — credential-free illustrative first run and its explicit limitations.
- [CTO architecture](./CTO_ARCHITECTURE.md) — current system architecture and trust boundaries.
- [Environment contract](./ENVIRONMENT_CONTRACT.md) — required/optional variables, public/server classification, and preflight commands.
- [Security and privacy runbook](./SECURITY_PRIVACY_RUNBOOK.md) — credential response, telemetry contract, retention, privacy rights, escalation, and kill switches.
- [Decision Ledger data contract](./DECISION_LEDGER_DATA_CONTRACT.md) — field classification, ownership, retention, and evidence semantics before v2 writes.
- [Connector profiles](./CONNECTOR_PROFILES.md) — least-privilege integration profiles, failure behavior, and kill switches.
- [Licensed supply activation](./LICENSED_SUPPLY_ACTIVATION.md) — contractual, hosted, and technical gate for one bounded provider lane.
- [CTO plan completion matrix](./CTO_PLAN_COMPLETION_MATRIX.md) — phase-by-phase evidence audit and remaining external gates.
- [CTO plan and pending-task audit](./CTO_PLAN_PENDING_TASK_AUDIT.md) — current source-level reconciliation, remediated findings, failure modes, test map, and the exact external work still open.
- [Executable CTO work packages](./cto-work-packages.json) — owners, dependencies, flags, cohort rules, rollback, evidence, and gate state for P0-P8.
- [Enterprise implementation status](./ENTERPRISE_IMPLEMENTATION_STATUS.md) — implementation evidence and hosted gaps.
- [Release evidence](./release-evidence.json) — machine-readable local, hosted, deployment, and external gate states.
- [Production activation record](./production-activation.json) — deliberately draft, fail-closed approval and operations record consumed by `pnpm release:readiness`.
- [Public asset rights register](./PUBLIC_ASSET_RIGHTS.json) — exact active bytes, localized alternatives, excluded exploration, and deliberately open documentary/legal review state.
- [Public asset legal review packet](./ASSET_LEGAL_REVIEW_PACKET.md) — reviewer checklist, three-business-day target, release-owner procedure, and unresolved documentary evidence.
- [Performance baseline](./performance-baseline.json) — five-run optimized-build desktop and Fast 3G mobile Lighthouse medians and transfer budgets.
- [Post-curation performance comparison](./performance-after-library-curation.json) — fresh five-run production-server medians after the governed UI-library curation slice.
- [Staging activation checklist](./STAGING_ACTIVATION_CHECKLIST.md) — target provisioning and evidence requirements for migration replay, two-user RLS, restore, privacy, and deployed E2E gates.
- [gstack workflow](./GSTACK_WORKFLOW.md) — local review and QA workflow.

## Design

- [Rama Lagom component curation](./designs/rama-lagom-component-curation.md) — approved Office Hours decision record for the 2026-08-25 ReUI, Motion Primitives, Magic UI, and Tailark curation slice.
- [UI library component audit](./UI_LIBRARY_COMPONENT_AUDIT.md) — frozen public-catalog disposition for every observed component and block category.
- [Rama Decision Architecture redesign](./designs/rama-decision-architecture-redesign.md) — active full-journey visual system, section architecture, implementation boundary, and rollout gates.
- [Nordic Decision Desk redesign brief](./designs/nordic-decision-desk-redesign-brief.md) — research-backed audit and earlier short-landing direction, retained as input to the active Decision Architecture.
- [Design implementation](./design-implementation.md)
- [UI redesign implementation plan](./UI_REDESIGN_IMPLEMENTATION_PLAN.md)
- [Rama design-system master](../design-system/rama-realty/MASTER.md)
- [Dashboard design-system page](../design-system/rama-realty/pages/dashboard.md)

## Retained review and concept artifacts

- [Enterprise foundation](./ENTERPRISE_FOUNDATION.md)
- [Design sprint report](./design_sprint_report.md)
- [Vellaro design implementation](./VELLARO_DESIGN_IMPLEMENTATION.md)
- [Archivanta adaptation review](./designs/archivanta-rama-adaptation-plan.md)
- [CTO recommendations implementation plan](./designs/cto-recommendations-implementation-plan.md)

These files are historical inputs or review artifacts. They are not authorization to restore unsupported claims, Vellaro/Archivanta product identity, glass-heavy styling, or illustrative-record handoff.

## Repository-owned skill inventory

- [Banner design](../.agents/skills/banner-design/SKILL.md)
- [Brand](../.agents/skills/brand/SKILL.md)
- [Design](../.agents/skills/design/SKILL.md)
- [Design system](../.agents/skills/design-system/SKILL.md)
- [Impeccable](../.agents/skills/impeccable/SKILL.md)
- [Slides](../.agents/skills/slides/SKILL.md)
- [UI styling](../.agents/skills/ui-styling/SKILL.md)
- [UI/UX Pro Max](../.agents/skills/ui-ux-pro-max/SKILL.md)
- [Workflow init](../.agents/skills/workflow-init/SKILL.md)

Unapproved concept documents and generated design explorations may be retained for review, but cannot override `AGENTS.md`, the approved CTO plan, the claims registry, or governed catalog contracts.

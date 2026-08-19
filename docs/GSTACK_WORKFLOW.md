# gstack operating model for Rama Realty

## Decision

Rama uses gstack as an engineering workflow layer for Codex. The upstream project is a collection of `SKILL.md` workflows and optional local browser/runtime tools; it is not an MCP server and it does not receive production credentials.

The installed baseline is upstream gstack v1.67.0.0 at commit `ae8914af7edaf248f5b0dcd60518d2f6890ad0da`, configured with:

- Codex host output and `gstack-` namespacing.
- Proactive skill routing enabled.
- Telemetry disabled.
- Team auto-update hooks disabled.
- gbrain and remote artifact synchronization disabled.

The installation produced 54 Codex skill directories and the Windows Playwright browser runtime. The upstream `gstack-ship` skill currently exceeds gstack's own 40K-token guidance; it is installed for completeness but is not part of this workspace's default route.

## Workflow by change type

| Change | Planning | Implementation review | Runtime proof |
| --- | --- | --- | --- |
| Product/feature | `gstack-autoplan` + CEO review | `gstack-plan-eng-review` | Acceptance matrix tied to user outcomes |
| UI/interaction | Design + engineering plan reviews | `gstack-design-review` + `gstack-review` | `gstack-qa` at 390, 768, 1280, and 1440 px |
| Voice/Gemini | Engineering review + threat boundary | `gstack-cso` + `gstack-review` | permission denial, interruption, fallback, timeout, cleanup |
| Supabase/auth | Engineering review + data boundary | `gstack-cso` + `gstack-review` | unauthenticated, owner, and cross-owner behavior against hosted RLS |
| Defect | `gstack-investigate` | focused review | reproduce before/after; regression assertion |
| Release | only after Git/remote policy exists | ship/landing workflow | CI, preview, hosted env, rollback evidence |

## Rama-specific stop gates

The workflow must stop rather than infer permission when a change would:

- present illustrative records as live or licensed inventory;
- expose a provider key, database password, service-role key, or long-lived token to the browser;
- give a model-requested tool direct privileged access instead of a validated server boundary;
- enable production writes, CRM routing, analytics, or deployment without an environment and consent decision;
- introduce npm commands, a second lockfile, Figma MCP, or unreviewed scraping as inventory supply;
- ship from this folder before it becomes an intentional Git repository.

## Local definition of done

1. Repository and relevant Next.js local documentation inspected before edits.
2. Product and data-source claims remain explicit and truthful.
3. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
4. Desktop and mobile renders have no horizontal overflow.
5. Pointer and keyboard flows work; focus, live regions, dialogs, and reduced motion are checked.
6. Voice resources are stopped on completion, cancellation, denial, error, timeout, and unmount.
7. Hosted Supabase, Gemini entitlement, provider licensing, and production-rate-limit claims remain unverified until tested in their target environments.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Rama Realty engineering contract

- Use pnpm only. Do not run `npm`, `npx`, Yarn, or create another lockfile.
- Preserve the public product boundary: voice-led Dubai property discovery, explainable criteria, and explicitly illustrative inventory until a licensed provider is connected.
- Keep `GEMINI_API_KEY` and every privileged connector credential server-only. Browser code receives only constrained, short-lived tokens or same-origin API responses.
- Zustand owns bounded presentation state. Media streams, audio contexts, sockets, abort controllers, timers, and focus-return elements stay component-owned and are disposed on every exit path.
- Supabase remains canonical for application data; client state is never treated as property truth. Owner-scoped data requires JWT validation plus RLS.
- Preserve the approved Quiet → Converse → Confirm design: Source Serif 4 plus Instrument Sans, restrained sky-blue and sand accents, compact 6–8px controls, generous whitespace, and the Residential Horizon hero. The minimal hero contains one original, rights-registered Dubai residential cityscape with a transparent-over-image navigation rail; Rama identity; a short localized promise; one sentence of support; the project-owned criterion-aware Decision Aperture; a primary “Talk to Rama” action; and an equally capable “Type instead” action. The cityscape is atmosphere, never inventory. Voice, text, criteria review, and confirmation live in one bounded native dialog that becomes a mobile bottom sheet; long transcripts and text scroll internally without changing the outer layout. Stable illustrative criteria proof begins below the fold. Use GSAP only for bounded landing reveal/scroll choreography and Motion only for semantic interface state; both must stop under reduced motion. Avoid decorative curves, pill-heavy SaaS chrome, glass effects, generic orbs, fabricated credibility claims, and invented live inventory.
- Build shared Rama UI primitives as shadcn-compatible source registry items in `registry.json`; the repository components remain the source of truth and generated `public/r` artifacts are build outputs.
- Figma MCP is out of scope. Superdesign is the design exploration source; this repository is the implementation source of truth.

## Skill routing

gstack is an installed Codex skill suite, not an MCP server. Use the prefixed skills so they cannot collide with other personal workflows.

- New feature or ambiguous product work: `gstack-autoplan`, with `gstack-plan-ceo-review`, `gstack-plan-design-review`, and `gstack-plan-eng-review` as applicable.
- UI implementation or redesign: `gstack-design-review` after the first working render, not before repository evidence is collected.
- Debugging: `gstack-investigate`; do not patch before reproducing and isolating the failure.
- Pre-handoff code review: `gstack-review`.
- Browser behavior and responsive verification: `gstack-qa` or `gstack-qa-only` using `http://localhost`, not `127.0.0.1`, because Next.js protects development assets by origin.
- Security-sensitive routes, tokens, auth, Supabase, or connector work: `gstack-cso` in addition to engineering review.
- Preserve context on long tasks with `gstack-context-save` and `gstack-context-restore`.
- Do not use `gstack-ship`, deployment, landing, or team hooks until this folder is an intentional Git repository with a reviewed remote and branch policy.

Every handoff must run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`; interactive changes also require rendered desktop/mobile checks, keyboard semantics, no horizontal overflow, and a reduced-motion review.

## Health Stack

- typecheck: `pnpm typecheck`
- lint: `pnpm lint`
- test: `pnpm test`
- build: `pnpm build`

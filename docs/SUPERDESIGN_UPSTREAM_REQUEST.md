# Superdesign pnpm support request

Use this text for the upstream issue. The application repository must not run the current `npx` workflow.

## Request

Please provide a documented, version-pinned pnpm installation and invocation path for Superdesign that does not shell out to npm/npx, install an unpinned latest package, modify the consuming repository lockfile, or require application credentials.

Acceptance criteria:

- installable with pnpm using an explicit version;
- runnable through a package script or documented pnpm command;
- published package integrity/provenance available for review;
- dependency and permission surface documented;
- input/output paths can be confined to an isolated workspace;
- no network access after an explicit dependency-fetch phase, where feasible;
- exports inert design artifacts without writing application source automatically;
- supports a minimal smoke test in a credential-free container.

## Repository decision

Track the upstream response with an owner and review date. If there is no acceptable path within 30 days, build the isolated design-lab wrapper described in `docs/DESIGN_TOOLING_POLICY.md`: its own directory and lockfile, pnpm-only exact versions, no production environment, read-only design-system input, inert export output, and a reviewed upgrade process. The wrapper is design tooling, never part of the application build or release evidence chain.

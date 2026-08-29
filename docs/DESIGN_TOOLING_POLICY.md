# Design tooling policy

The application repository is the implementation source of truth. Superdesign may be used for bounded visual exploration, but it cannot bypass the repository design system, public-copy policy, asset-rights register, accessibility checks, or the pnpm-only engineering contract.

## Superdesign execution boundary

- Do not run `npx`, npm, Yarn, Bun, or an unpinned `@latest` package in this checkout.
- Prefer an installed, version-pinned Superdesign plugin. If a future workflow requires a CLI, run a reviewed and pinned package through pnpm in a separate design-lab directory with its own non-production configuration; never give that process production credentials.
- Canvas output is a proposal. Port accepted changes through repository components and tokens, then run the normal code review and rendered QA gates.
- Do not export generated images into `public/` until their source, byte hash, intended surfaces, and rights evidence are registered in `docs/PUBLIC_ASSET_RIGHTS.json`.
- Figma MCP remains out of scope for this project.

`pnpm package-manager:check` rejects alternate root lockfiles and executable npm/npx/Yarn/Bun commands in package scripts, repository scripts, and GitHub workflows. This keeps the policy enforceable without preventing documentation from explaining why an unsafe command is prohibited.

Immediate policy: keep canvas refresh disabled in this checkout and request upstream pnpm support. Long-term fallback: maintain a minimal version-pinned pnpm wrapper in an isolated container/design lab, review its lockfile and permissions, and export only inert design artifacts for human review. Do not normalize a permanent npm exception in the application repository.

The ready-to-submit upstream request and 30-day decision trigger are in [`SUPERDESIGN_UPSTREAM_REQUEST.md`](./SUPERDESIGN_UPSTREAM_REQUEST.md).

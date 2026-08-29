# Release candidate formation

This runbook creates an immutable candidate; it does not grant production approval. Run it only after the working-tree review is complete and from a fresh machine or CI runner whose isolated pnpm store passes the environment diagnostic.

## Candidate sequence

1. Create `release/v1.0.0-rc.1` from the reviewed source state. Do not merge unrelated work into it.
2. On a fresh runner, use Node `24.19.0` and pnpm `11.20.0`, then run:

   ```powershell
   pnpm fetch --frozen-lockfile --store-dir "$env:RUNNER_TEMP/rama-rc-store"
   $env:PNPM_CONFIG_TRUST_LOCKFILE = "true"
   pnpm install --offline --frozen-lockfile --store-dir "$env:RUNNER_TEMP/rama-rc-store"
   pnpm environment:diagnose -- --store-status
   pnpm check
   pnpm e2e
   pnpm build-storybook
   pnpm audit --audit-level high
   ```

3. Review the complete staged diff, including asset removals/moves and migrations. Commit once the evidence-generating source is stable:

   ```powershell
   git add -- <reviewed-paths>
   git diff --cached --check
   git diff --cached --stat
   git commit -m "release: form v1.0.0-rc.1 candidate"
   $env:RAMA_RELEASE_COMMIT = (git rev-parse HEAD).Trim()
   pnpm release:candidate
   git push --set-upstream origin release/v1.0.0-rc.1
   ```

4. Open a pull request. The exact candidate SHA must pass the `dependency-integrity` job and the full `quality` job. Pull-request code cannot mint authoritative release evidence. After required review, merge without bypassing protection; the protected `main` push reruns both jobs and creates `ci-build-attestation-<SHA>` only after their authenticated success. Download and hash that artifact; local and pull-request logs are diagnostic only.
5. Deploy the attested `main` SHA to staging and run the protected staging workflow. Do not accept artifacts generated from a different SHA, provider configuration, Supabase project, or workflow attempt.
6. After all external gates are complete and the evidence packet is frozen, create a signed annotated `v1.0.0-rc.1` tag at the already-verified SHA and push only that tag. If any code changes, abandon the candidate and form `v1.0.0-rc.2`; never move or replace an RC tag.

## Drift controls

- Protect the release branch: pull-request changes only, required CI, required review, no force pushes, no branch deletion during the evidence window.
- Pin the candidate by 40-character SHA everywhere. Branch names and tags are human handles, not evidence identity.
- `partially_verified` is allowed only as an honest status-ledger value. It is invalid for candidate attestation, staging acceptance, go/no-go entry, and production readiness.
- `docs/release-evidence.json` may describe local diagnostics, but authoritative build evidence is the CI artifact written by `scripts/write-ci-build-attestation.mjs`. Hosted, device-lab, legal, and human evidence stays in its authoritative system and is referenced by immutable HTTPS URI plus SHA-256.
- Freeze evidence for 24 hours before the meeting. A rerun, changed artifact, or changed runtime flag restarts the freeze.

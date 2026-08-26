# Public asset legal review packet

Status: **awaiting designated human legal reviewer**  
Release owner: **CTO / release owner**  
Review target: **three business days after assignment**  
Machine-readable inventory: [`PUBLIC_ASSET_RIGHTS.json`](./PUBLIC_ASSET_RIGHTS.json)

This packet makes the documentary gate executable. It does not approve an asset, substitute for legal advice, or change `productionConclusion` from `documentary_evidence_open`.

## Reviewer checklist

- [ ] Confirm the master provenance and generation/source identifier for every deployable image and animation.
- [ ] Recalculate and compare the registered SHA-256 hash and byte count for every active file.
- [ ] Confirm usage rights cover the recorded public surfaces, retention period, territories, and derivative formats.
- [ ] Confirm desktop and mobile crop rights, including the distinct art-directed hero crops.
- [ ] Confirm the visible illustrative-atmosphere disclosure and decorative empty-alt strategy are accurate.
- [ ] Confirm filenames, embedded metadata, localized descriptions, captions, and surrounding copy do not imply inventory, availability, developer affiliation, or a named listing.
- [ ] Confirm excluded exploration assets remain unreachable from production routes.
- [ ] Attach a dated, immutable approval artifact that identifies the reviewer, scope, decision, and release commit.

## Release-owner procedure

1. Run `pnpm test -- public-asset-rights` to verify inventory, file hashes, runtime reachability, and exclusion rules.
2. Give the reviewer this packet, `PUBLIC_ASSET_RIGHTS.json`, the referenced generation records, and the exact release commit.
3. Store the signed review artifact outside the application bundle using the organization’s evidence-retention policy.
4. Only after approval, update each reviewed asset’s `documentaryProof`, `legalReview`, and `productionEligibility`, then set the register conclusion to `approved`.
5. Run `pnpm release:readiness` in the target environment. Never alter the rights state merely to make that command green.

## Current unresolved evidence

- The generated hero derivatives and editorial scenes have generation identifiers and registered hashes, but no human legal approval.
- `public/images/rama-hero-editorial-daylight.png` is asserted as project-owned but still lacks documentary proof.
- Production and staging therefore remain blocked on this gate even when every repository check passes.

# Rama Impeccable UI/UX Audit

Date: 2026-08-25  
Scope: public EN/AR landing, voice/text composer, Decision Specimen, intercepted Decision Room return path, and saved-decision continuity.  
Reference contract: Quiet → Converse → Confirm; Nordic Lagom restraint; illustrative supply only.

## Outcome

The public experience improved from **15/20 (Good)** to **19/20 (Release-quality, performance gate open)** on the Impeccable audit rubric.

| Dimension | Before | After | Evidence |
| --- | ---: | ---: | --- |
| Accessibility | 3 | 4 | 44px targets, visible focus, EN/AR semantics, fixed-dialog long text, route-aware focus return, AA contrast checks, reduced-motion coverage. |
| Performance | 3 | 3 | Responsive AVIF/WebP hero, explicit preloads, bounded motion, interaction-loaded composer, and a five-run baseline are present. Desktop passes; mobile Fast 3G LCP remains above target. |
| Responsive | 4 | 4 | No horizontal overflow at 320px, 390px RTL, 768px, 1024px, 1280×720, and 1440px. |
| Theming | 2 | 4 | The DTCG-inspired compiler now resolves primitive, semantic, and component layers with zero active raw-value violations and generated CSS/TypeScript parity. |
| Integrity | 3 | 4 | The visual system is distinctly Rama; hero actions now work before and after hydration and all public claims remain policy-compliant. |

## Resolved findings

- **P0 — Primary hero actions could remain visually disabled.** The hydration subscription never notified React. The controls now render enabled, retain early intent through a no-script GET fallback, and open the same bounded composer after hydration.
- **P1 — Stale demo artifacts could create false-green E2E results.** Playwright now forces a clean demo build.
- **P1 — Supporting public copy rendered at approximately 12.8–14.4px.** Criteria, media captions, specimen explanations, timelines, capability descriptions, consent copy, and footer legal text now use governed body/support tokens with calmer line-height.
- **P1 — Intercepted Decision Room focus restoration could target a stale DOM node.** Rama now records the semantic source and restores focus from the landing route after navigation settles.
- **P1 — Voice fallback E2E depended on development compilation timing.** The scenario now deterministically supplies the disabled Live-token response and verifies the recorded fallback UI.
- **P2 — Native browser finish was incomplete.** Scrollbar and caret colors now use Rama semantic tokens; selection and focus styling remain governed.
- **P1 — The public route eagerly hydrated the complete voice working surface.** The static Decision Aperture and accessible Talk/Type launchers now render first; the bounded composer loads only after intent while preserving no-JavaScript GET recovery, example-brief events, Escape behavior, and route-aware focus restoration.
- **P1 — Analytics pageviews could include callback query tokens.** PostHog now initializes only after explicit consent and records pathname-only pageviews; query parameters are never sent.
- **P1 — Next observability used deprecated conventions.** `instrumentation-client.ts` and `app/global-error.tsx` now capture scrubbed client failures without replay, PII, or client tracing, and the deprecated client config is removed.

## Visual verdict

- The hero reads as one centered invitation: identity, short promise, restrained Decision Aperture, two equivalent entry paths, method cue, and factual atmosphere disclosure.
- The Residential Horizon image is recognizably Dubai residential architecture rather than generic travel footage or an implied listing.
- Arabic uses natural shaping and mathematical centering without character splitting or physical-direction hacks.
- Operational sections return to logical start alignment; the specimen, comparison, evidence, and ledger surfaces do not inherit marketing centering.
- The long-scroll narrative is deliberate and varied. No duplicate hero form, property grid, testimonial, rating, award, partner, or live-inventory claim was introduced.

## Verification

- `pnpm registry:build`: passed; 26 artifacts.
- `pnpm registry:check`: passed.
- `pnpm tokens:check`: passed; 0/0 active findings.
- `pnpm claims:check`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed; 56 files, 256 tests.
- `pnpm build`: passed; 24 route entries generated.
- `pnpm e2e`: passed; 38/38 scenarios in the final forced-clean matrix.
- `pnpm performance:baseline`: five cold runs per profile. Desktop median score 99, LCP 938.23 ms, TBT 19 ms, CLS 0. Mobile Fast 3G median score 84, FCP 1398.15 ms, LCP 3997.29 ms, TBT 183 ms, CLS 0.
- Impeccable source detector: 285 advisory craft notes, 0 actionable warnings/errors across `app`, `components`, and `lib`.
- Rendered evidence: `../screenshots/decision-architecture-1440-final.png`, `../screenshots/decision-architecture-ar-390-final.png`, and `../screenshots/decision-architecture-specimen-final.png`.

## Remaining gates

- Reduce mobile Fast 3G LCP from 3997.29 ms to at most 2500 ms before staging approval; desktop already passes.
- Complete the designated legal review for the hero and eight editorial scenes; the rights manifest is present but approval is external.
- Re-check the development-only Next image LCP warning under production Lighthouse before changing below-fold image priority; only the hero should be eagerly loaded by design.

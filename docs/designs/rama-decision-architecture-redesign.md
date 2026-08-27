# Rama Decision Architecture redesign

Status: active implementation direction  
Approved: 2026-08-23  
Reference: Archivanta structure and pacing, adapted rather than cloned

## Centered Lagom v2 decision record

The public hero and qualifying short landing introductions are centered. Operational content remains logically start-aligned. The hero uses one functional radial contrast scrim, the reduced-motion-safe Rama AI signal, responsive derivatives from the registered 8K master, and a transparent-to-ink navigation rail. Dark mode is deferred. The custom DTCG-inspired token compiler is authoritative and emits both TypeScript and CSS; raw-value adoption may not increase from the checked-in baseline. The legacy composition remains frozen behind the existing flags for 30 days after production GA, after which release readiness must remove it.

Design-steward approval is required for every new primitive, font, spacing value, radius, motion role, or registry component. Approval records the Lagom rationale, accessibility impact, and rejected alternative. The default is rejection when the existing system can express the decision.

## Outcome

Rama’s frontend uses structural Archivanta fidelity—editorial scale, asymmetric media, alternating paper surfaces, long-scroll rhythm, rectangular geometry, and one sticky narrative—inside an original Nordic Lagom buyer-decision product.

The public route is a complete explanation of the method, not a catalog. Its entry rhythm is Quiet → Converse → Confirm: the first viewport stays minimal, then voice and text converge inside one bounded conversation dialog into an editable brief review and a single confirmation. `/discover/{searchRunId}` remains the sole results, evidence, comparison, Decision Ledger, and consent-handoff surface.

## Active section map

1. Transparent-over-image decision navigation that settles into a quiet ink rail after scroll.
2. Minimal Residential Horizon Voice Decision Desk with one original, rights-registered Dubai residential cityscape; Rama identity; short heading; one-sentence subtitle; the Rama AI signal; “Talk to Rama”; and “Type instead.” The decorative image uses art-directed desktop and mobile crops and exposes no listing or inventory interaction.
3. Decision architecture, not a portal, with stable illustrative criteria proof.
4. Four illustrative decision patterns that seed the original conversation.
5. Inspectable capability specimen.
6. Sticky Decision Room narrative.
7. Native scroll-snap decision method.
8. Boundary Ledger.
9. Evergreen Dubai buyer questions.
10. Inspectable FAQ.
11. Return to the original conversation.
12. Product-state footer.

## Implementation boundary

- Server Components assemble the static long-form composition.
- `LandingPage` is retained as the rollback composition and exposes a bounded `composer` mode. Its resting state is only the Decision Aperture and two launch actions; a native dialog owns voice, text, brief review, contradiction recovery, confirmation, and navigation.
- The dialog becomes a mobile bottom sheet. Its body and bounded textareas scroll internally, so longer transcripts, drafts, criteria, and errors cannot push the outer layout or displace the actions.
- `RAMA_LANDING_COMPOSITION_ENABLED=false` restores the previous landing for one rollout cycle.
- Brief review changes use a 350ms abortable debounce and latest-response-wins behavior.
- Existing discovery HTTP, Supabase, migration, and `BuyerDecisionEnvelopeV2` contracts are unchanged.
- Project-owned registry sources publish the evidence and decision primitives; `public/r` is generated and parity-checked in CI.

## Truth and media

Only approved claims from `docs/CLAIMS_REGISTRY.md` are public. The implementation does not import `components/archivanta/**`, unsupported market facts, testimonials, ratings, awards, partner marks, or live-supply implications. The active first viewport combines `public/lottie/ai.json` with a decorative residential cityscape that exposes no listing identity or availability action. The animation remains blocked from production until documentary proof is recorded in `docs/PUBLIC_ASSET_RIGHTS.json`. Below it, original fictional scenes are governed editorial context: their localized alternatives describe only the scene, their visible captions state the illustrative boundary, and none appears in results or implies an available residence.

## Visual system

Warm paper `#F5F3ED`, chalk `#FCFBF7`, ink `#172126`, Fjord `#4F7787`, pale sky `#DCE9EC`, sand `#B58C54`, pine `#3F6B5A`, clay `#9A654D`, and mineral rules `#D6D8D2`. Instrument Sans carries interface and body copy; Source Serif 4 is selective editorial contrast; Noto Sans Arabic owns Arabic text and display roles.

The quiet hero uses an intentionally short two-line editorial promise and preserves natural Arabic shaping. It contains no persistent input or criteria plane. The first stable illustrative criteria proof appears in the next section, while the buyer’s working criteria remain inside the opened dialog until confirmation.

## Open pre-staging gates

- Restore authenticated access to Superdesign project `38f08c91-f561-462b-bd06-bc0e992eaa98`, generate 1440px/390px approved drafts, and update `.superdesign/resume.json` only after access succeeds.
- Attach documentary ownership evidence and legal review for the registered production assets.
- Run the complete rendered EN/AR, accessibility, performance, and engineering matrix against the release candidate.

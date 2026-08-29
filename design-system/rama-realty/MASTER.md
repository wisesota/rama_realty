# Rama Decision Architecture — active design system

> Page-specific guidance in `design-system/rama-realty/pages/` may increase information density for operations, but it cannot override product truth, evidence semantics, accessibility, or these tokens.

## Direction

Rama adopts the editorial scale, asymmetric media, alternating paper surfaces, long-scroll rhythm, rectangular geometry, and one signature sticky narrative associated with the approved Archivanta reference. The implementation is an original Rama system: it does not copy source code, CDN assets, portfolio content, testimonials, ratings, or credibility claims.

Nordic Lagom means enough information to decide and no ornament pretending to be information. The memorable object is the buyer’s decision structure: required criteria, preferred criteria, unknowns, contradictions, evidence state, and Decision Ledger changes.

## Product boundaries

- Voice-led Dubai property discovery with explainable criteria.
- Current results are illustrative until licensed inventory is connected.
- Illustrative residences cannot be sent to an advisor.
- Property facts show their source and observation state when available.
- Landing demonstrates the method; `/discover/{searchRunId}` is the only results and dossier surface.
- Never publish testimonials, ratings, awards, partner marks, yields, legal outcomes, or live-inventory implications without approved evidence.

## Color roles

| Role | Value | Use |
| --- | --- | --- |
| Warm paper | `#F5F3ED` | Primary buyer-facing canvas |
| Chalk | `#FCFBF7` | Inputs and evidence planes |
| Blue-black ink | `#172126` | Text, rules, primary action |
| Body | `#3F4A4F` | Long-form copy |
| Slate | `#556168` | Supporting metadata |
| Mineral | `#D6D8D2` | One-pixel hierarchy rules |
| Fjord | `#4F7787` | Links, focus context, active evidence |
| Pale sky | `#DCE9EC` | Contextual surface |
| Sand | `#B58C54` | Rare annotation or assumption accent |
| Pine | `#3F6B5A` | Confirmed state |
| Clay | `#9A654D` | Unknown, stale, action-needed state |
| Error | `#924333` | Error and contradiction |

The source token files under `tokens/` are canonical. Avoid gradients, glass panels, metallic simulation, neon, and dark-luxury black/gold styling.

## Typography

- Instrument Sans: interface, body, labels, wordmark, numbers.
- Source Serif 4: selected display headings and editorial contrast only.
- Noto Sans Arabic: all Arabic interface and display copy. Never split Arabic characters for animation.
- Body copy: at least 16px and normally no wider than 65–75 characters.
- Labels use sentence case. Uppercase tracking is reserved for brief taxonomy and short indices.
- Tabular numerals are required for AED, dates, areas, and comparisons.

## Layout and rhythm

- 12-column rail capped at 1240px.
- 4px base rhythm; principal steps: 8, 12, 16, 24, 32, 48, 72, 96.
- Header: solid 64px paper rail.
- Controls: 6px radius and minimum 44px target.
- Evidence planes: 0–8px radius.
- Editorial media: 16px radius.
- Default elevation: none. Use one-pixel rules and surface changes before shadow.
- Prefer rows, definition lists, aligned planes, and asymmetric compositions over equal feature cards.

## Public experience

1. Minimal Voice Decision Desk.
2. Decision architecture with stable illustrative criteria proof.
3. Illustrative decision patterns.
4. Inspectable capabilities.
5. Sticky Decision Room specimen.
6. Decision method rail.
7. Boundary Ledger.
8. Evergreen Dubai buyer briefings.
9. Inspectable FAQ.
10. Return to the original conversation.
11. Product-state footer.

The first viewport follows Quiet → Converse → Confirm. It shows Rama identity, a short one-line English desktop heading, one supporting sentence, the rights-registered `public/lottie/ai.json` signal, primary “Talk to Rama,” and equally capable “Type instead.” It does not show a persistent form, transcript, criteria slip, or confirmation plane. Stable illustrative criteria proof starts below the fold; architectural imagery elsewhere is atmospheric and never implies availability.

## Interaction

- Voice is a visible labeled action adjacent to an equally capable text path; never a floating orb.
- Either path opens the same bounded native dialog. On mobile it becomes a bottom sheet; Escape closes it and focus returns to the opener.
- The dialog owns voice, text, brief review, and confirmation. Header, status, and footer remain stable while long transcripts, text, criteria, and errors scroll inside the body; bounded textareas use internal overflow and never reflow the outer page.
- Brief editing waits 350ms, aborts the older request, and accepts only the latest response.
- Sticky specimen uses CSS sticky positioning and a small IntersectionObserver island.
- Process rail uses native scrolling, scroll snap, and explicit controls. Never hijack the wheel.
- Motion explains the finite Criterion Weave transformation, focus/hover expansion, sticky narrative state, or application state transitions.
- No idle pulse, infinite marquee, parallax, decorative SplitText, or perpetual motion.
- Reduced motion removes nonessential transforms and animation while preserving every state in text.

## Evidence components

Repository-owned registry primitives are the source of truth: `voice-action`, `voice-discovery-dialog`, `editorial-media`, `criteria-slip`, `evidence-state`, `boundary-ledger`, `process-rail`, `decision-specimen`, `comparison-plane`, `decision-ledger-timeline`, and `consent-handoff`, plus the shared shell, heading, media, button, navigation, and operations primitives.

Below the minimal hero, the media system uses eight original fictional Dubai scenes as decision context: an asymmetric facade/courtyard diptych, four illustrative decision-pattern images, one inspectable interior, and one blue-hour closing panorama. Images are lazy by default, use responsive `sizes`, carry localized scene alternatives and adjacent illustrative-context captions, and never enter the property-results or availability surfaces.

Components render typed state. They never derive property facts from marketing prose or render model-authored HTML.

## Responsive and bidirectional behavior

Verify EN and AR at 320, 390, 768, 1024, 1280, and 1440px, plus 1280×720 and short landscape. Use logical properties, preserve intentional order in RTL, keep 44px targets and visible focus, and prevent horizontal document overflow. Mobile hero order is promise → Criterion Weave → actions; the working experience opens as a bounded bottom sheet with internal scrolling.

## State and accessibility floor

- Render idle, requesting, listening, processing, review, recalculating, permission-denied, unsupported, fallback, error, empty, partial, and success states.
- Every voice state has localized text and an available typed recovery.
- Focus returns after dialogs; Escape behavior is explicit.
- Color never carries evidence state alone.
- Scene alt text never implies listing availability.
- WCAG AA contrast, keyboard completion, live-region clarity, reduced motion, and JavaScript-failure fallback are release requirements.

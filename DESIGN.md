---
name: "Rama Decision Architecture"
description: "A calm, voice-led Dubai buyer decision system that makes criteria, evidence, unknowns, and changes inspectable."
colors:
  warm-paper: "#f5f3ed"
  chalk: "#fcfbf7"
  architecture-gray: "#ecebe5"
  blue-black-ink: "#172126"
  body-copy: "#3f4a4f"
  slate: "#556168"
  mineral-rule: "#d6d8d2"
  fjord: "#4f7787"
  pale-sky: "#dce9ec"
  sand: "#b58c54"
  pine: "#3f6b5a"
  clay: "#9a654d"
  contradiction: "#924333"
  focus-fjord: "#315f73"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.2vw, 5.2rem)"
    fontWeight: 520
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  hero:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(3.6rem, 7vw, 6rem)"
    fontWeight: 520
    lineHeight: 0.94
    letterSpacing: "-0.03em"
  hero-mobile:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.85rem, 14vw, 4rem)"
    fontWeight: 520
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  hero-short:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(3.4rem, 5.6vw, 5rem)"
    fontWeight: 520
    lineHeight: 0.94
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.6rem, 2.5vw, 2.35rem)"
    fontWeight: 520
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  action:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.12em"
  arabic-display:
    fontFamily: "Noto Sans Arabic, Arial, sans-serif"
    fontWeight: 520
    lineHeight: 1.15
rounded:
  control: "6px"
  evidence: "8px"
  media: "16px"
spacing:
  base: "4px"
  compact: "8px"
  small: "12px"
  default: "16px"
  medium: "24px"
  large: "32px"
  section-small: "48px"
  section-medium: "72px"
  section-large: "96px"
components:
  button-primary:
    backgroundColor: "{colors.blue-black-ink}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.blue-black-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  composer-plane:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.blue-black-ink}"
    rounded: "{rounded.evidence}"
    padding: "clamp(16px, 2.4vw, 28px)"
  criteria-slip:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.blue-black-ink}"
    rounded: "{rounded.evidence}"
    padding: "clamp(16px, 2.4vw, 28px)"
  evidence-state:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.blue-black-ink}"
    rounded: "{rounded.control}"
    padding: "12.8px"
  decision-specimen:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.blue-black-ink}"
    rounded: "{rounded.evidence}"
    padding: "clamp(24px, 5vw, 64px)"
  media-frame:
    backgroundColor: "{colors.architecture-gray}"
    rounded: "{rounded.media}"
---

# Design System: Rama Decision Architecture

## Overview

**Creative North Star: "Rama Decision Architecture"**

Rama is an editorial decision desk, not a property portal or luxury brokerage. Its structural world uses oversized scale, alternating paper surfaces, long-scroll rhythm, rectangular geometry, and one sticky narrative. Nordic Lagom supplies the restraint: every visible object either helps a buyer state intent, inspect evidence, understand an unknown, or choose the next action. **Residential Horizon** is the public landing expression of this system: Dubai residential architecture establishes context while Rama holds the buyer's decision still.

The public discovery rhythm is **Quiet → Converse → Confirm**. The quiet first viewport places Rama identity, one short promise, one supporting sentence, the project-owned Rama AI signal, and two clear actions over one original Dubai residential cityscape. The image supplies atmosphere only and carries no property identity or inventory interaction. “Talk to Rama” is primary; “Type instead” is equally capable. Either action opens the same bounded conversation surface, where voice or text produces an editable brief and criteria review before one explicit confirmation. The landing explains the method; `/discover/{searchRunId}` is the only results, dossier, comparison, Decision Ledger, and eligible consent-handoff surface.

Current residences, prices, and matches are illustrative until licensed inventory is connected. Illustrative records cannot be sent to an advisor. Property facts retain source and observation state when available, and unsupported market performance, partnership, customer, award, professional-advice, or live-inventory claims never enter the visual language.

**Key Characteristics:**

- Editorial scale with quiet, information-bearing composition.
- A minimal first viewport that defers working complexity to one focused conversation surface.
- Warm paper, blue-black ink, Fjord context, and restrained state color.
- Required, preferred, unknown, contradiction, evidence, and change as signature forms.
- Original Rama imagery and content; reference structure is adapted, never cloned.
- Complete EN/AR parity with a deliberate RTL composition.

## Colors

The palette feels like an architectural archive in daylight: warm neutrals carry the work, dark ink establishes authority, and color is scarce enough to remain meaningful.

### Primary

- **Blue-Black Ink:** Primary text, one-pixel structural emphasis, dark sections, and decisive actions.
- **Fjord:** Links, focus context, active evidence, and purposeful interactive emphasis.

### Secondary

- **Pale Sky:** Contextual planes, active comparison areas, and the sticky Decision Room sequence.
- **Sand Annotation:** Rare indices, assumptions, and the closing invitation; never a luxury-metal effect.

### Tertiary

- **Pine Confirmation:** Confirmed source or buyer state.
- **Clay Unknown:** Unknown, stale, or action-needed state.
- **Contradiction Red:** Errors and incompatible criteria only.

### Neutral

- **Warm Paper:** Primary buyer-facing canvas.
- **Chalk:** Composer, evidence, input, and raised reading surfaces.
- **Architecture Gray:** Quiet fallback and functional inset surfaces.
- **Body Copy:** Long-form reading text.
- **Slate:** Secondary metadata and supporting labels.
- **Mineral Rule:** One-pixel dividers and structural edges.

**The Evidence-Redundancy Rule.** Color never communicates evidence state alone; pair it with a label, mark, icon, structure, or status sentence.

**The Rare-Accent Rule.** Fjord and sand clarify context or action. They do not decorate empty space.

## Typography

**Display Font:** Source Serif 4 (with Georgia and serif fallbacks)  
**Body and Interface Font:** Instrument Sans (with Arial and sans-serif fallbacks)  
**Arabic Font:** Noto Sans Arabic (with Arial and sans-serif fallbacks)

**Character:** Source Serif 4 gives English editorial headings a humane architectural voice; Instrument Sans keeps controls, facts, labels, and body copy exact. Noto Sans Arabic owns every Arabic role, including display, so the RTL experience is composed rather than transliterated.

### Hierarchy

- **Display:** Large section arguments and the closing invitation; use a tight Latin line-height and a maximum width near 14 characters.
- **Hero:** The first-viewport promise; keep the English desktop heading on one line at 1100px and above when the localized copy permits it.
- **Headline:** Pane, briefing, and specimen titles.
- **Body:** Minimum 16px for primary reading copy, normally constrained to 65–75 characters.
- **Action:** Compact sentence-case labels on controls with a minimum 44px target.
- **Label:** Short indices and taxonomies only; uppercase tracking is for Latin brief metadata, never general prose.
- **Arabic Display:** Use normal character shaping, zero artificial tracking, and roomier line-height. Never split or individually animate Arabic characters.

Use tabular numerals for AED values, dates, areas, section indices, and comparisons.

**The Two-Voice Rule.** Serif expresses the editorial argument; sans-serif expresses the system state. Do not use decorative display faces or add a third Latin family. Instrument Sans keeps `font-display: swap`; the larger editorial and Arabic families use explicit 400–700 production weights with `font-display: optional`, so a constrained connection retains Next.js’s metric-compatible fallback instead of repainting the hero after the LCP window.

## Layout

The system uses a 12-column rail capped at 1240px, fluid page gutters, and a 4px spacing base. Major vertical intervals come from the established 48px, 72px, and 96px section steps. The public hero header is transparent over the cityscape and settles into a restrained ink rail after scroll; interior product surfaces retain solid navigation. Prefer asymmetric panes, definition lists, aligned evidence planes, and ruled rows over equal feature-card grids.

The public long-scroll sequence is fixed: decision navigation → minimal Voice Decision Desk → decision architecture with stable illustrative criteria proof → illustrative decision patterns → inspectable capabilities → sticky Decision Room specimen → decision method rail → Boundary Ledger → evergreen buyer briefings → inspectable FAQ → return to the original conversation → product-state footer. The first viewport stays deliberately quiet: one residential cityscape, Rama identity, a short heading, one-sentence subtitle, the Decision Aperture, and the voice/text actions. It does not expose a form, transcript, criteria slip, or confirmation plane before the buyer acts.

Static marketing sections are server-rendered. Client behavior stays bounded to the discovery composer dialog, native process controls, and the small IntersectionObserver-driven specimen. The closing action reopens the original conversation surface; never add a second form or lead funnel.

### Responsive behavior

- At 1024px and below, split headings and major two-column specimens collapse; asymmetric panes become two columns before becoming one.
- At 768px and below, the quiet hero preserves promise → Decision Aperture → actions with an art-directed residential crop. The bounded native dialog becomes a bottom sheet whose header, status, and footer remain stable while its body scrolls. The sticky specimen becomes a complete static sequence.
- At 520px and below, controls remain two-up only when both preserve 44px targets; comparison, ledger, footer, and boundary planes become single column.
- Short desktop viewports compress hero spacing and animation size without hiding either launch action.
- Use logical properties for spacing, borders, alignment, and scroll direction. Preserve intentional reading order in RTL and mirror directional icons, not semantic content.
- Prevent document-level horizontal overflow. A deliberately scrollable taxonomy or process rail must remain keyboard reachable and visibly bounded.

### Centered Lagom boundary

Centering is reserved for the public hero and short landing introductions containing one heading and an optional lead no longer than 120 characters or three rendered lines. Forms, evidence rows, comparisons, timelines, FAQ answers, saved decisions, staff surfaces, and Arabic body copy use logical start alignment. Centering never inherits into an operational child. Arabic uses mathematical centering and natural shaping; fixed locale offsets are prohibited.

The Rama AI animation is the hero's read-only signal. The Decision Aperture retains six states—resting, requesting, listening, processing, complete, and error—inside the discovery dialog, where it maps the real lifecycle while localized status text carries all assistive meaning.

### Motion behavior

GSAP owns one bounded landing choreography island: the first-viewport entrance, a scroll-linked still-image shift capped at three percent, and one-time section reveals. Lottie owns the hero's Rama AI signal; Motion owns semantic micro-motion in the dialog Decision Aperture, discovery state, dialog transitions, and the one-pixel scroll-progress rule. The Decision Aperture reflects conversation state; it is not a decorative AI orb. Reduced motion renders the complete static composition immediately, leaves both signals stable, and removes sticky or scroll-linked treatment while keeping the narrative visible. Never split text, hijack the wheel, or animate operational surfaces for atmosphere.

**The One-Narrative Rule.** The Decision Room specimen is the single signature scroll story; every other section stays calm enough to support it.

## Elevation & Depth

Rama is flat by default. Depth comes from alternating paper, chalk, sky, and ink surfaces; one-pixel rules; crop boundaries; and changes in density. Shadows are not a general surface token. A restrained ambient shadow may be used only where a fixed transient surface, such as cookie consent, must separate from the page; focus uses a visible outline or ring, not shadow theater.

### Shadow Vocabulary

- **Bounded Dialog Ambient** (`0 1.6rem 4rem rgba(23, 33, 38, 0.22)`): The one approved lift for the native discovery dialog above its ink-tinted backdrop. It is not a card shadow.

**The Flat-by-Default Rule.** Try a rule, tonal shift, or spacing change before elevation. Do not introduce glass, blur-heavy panels, decorative gradients, glow, metallic simulation, or dark-luxury black-and-gold styling into the active buyer experience. The centered hero may use one functional radial contrast scrim; it is a legibility layer, not decoration.

### Token governance

The repository uses a custom DTCG-inspired primitive → semantic → component pipeline. Every token requires `$value`, `$type`, and `$description`; `scripts/build-tokens.mjs` emits the typed contract and CSS variables. CI rebuilds and rejects stale generated output. New raw colors, font families, spacing, radii, motion primitives, or registry components require a documented Lagom rationale, accessibility impact, rejected alternative, and CTO/design-steward approval. Dark mode is deferred; the experience remains intentionally light when the operating system prefers dark.

**Decision record — legacy literal migration, 2026-08-25.** The active CSS baseline moved from 829 ungoverned declarations to zero without changing rendered values. Exact pre-system values now live under the read-only `legacy.dimension` and `legacy.color` primitive namespaces. This is a migration boundary, not permission to expand the palette or spacing scale: new work must use semantic or component roles, and CI rejects any raw-value increase from zero. The accessibility impact is neutral because computed colors and dimensions are unchanged. The rejected alternatives were silently resetting the baseline, tolerating raw literals indefinitely, or changing hundreds of visual values in one unreviewable restyle. A future consolidation may replace legacy aliases with the four-pixel scale only through rendered regression review.

## Shapes

The dominant form is rectangular and architectonic. Controls use compact 6px corners, evidence planes and the desktop discovery dialog use square to 8px corners, and editorial media alone receives the softer 16px crop. On mobile, the discovery dialog borrows that 16px media radius only on its two top corners to read as a bottom sheet. Borders are one pixel. Every interactive target is at least 44px in both axes.

Circles are functional exceptions: the small microphone icon container, evidence marks, timeline nodes, and icon-only utility controls. They are never floating AI orbs, decorative bubbles, or a substitute for a label.

**The Evidence-Plane Rule.** Radius follows function: compact for controls, restrained for evidence, and softer only for media.

## Components

Repository source components and `registry.json` are authoritative; generated `public/r` files are build artifacts. Shared foundations are `section-shell`, `section-heading`, `media-frame`, `editorial-media`, `button`, `site-navigation`, and the operations primitives. Buyer-decision registry items are `voice-action`, `voice-discovery-dialog`, `criteria-slip`, `evidence-state`, `boundary-ledger`, `process-rail`, `decision-specimen`, `comparison-plane`, `decision-ledger-timeline`, and `consent-handoff`.

### 2026-08-25 — External component curation

Rama adds one governed `state-transition` registry primitive and extends `site-navigation` with scroll-aware `aria-current="location"`. The transition uses the existing 150ms semantic timing, a maximum 4px vertical offset, no height animation, and an immediate reduced-motion path; it improves voice-state continuity without changing canonical voice or transcript ownership. Scroll-aware navigation improves orientation through the long editorial document while native anchors retain URL, scrolling, and history behavior. ReUI, Motion Primitives, Magic UI, and Tailark remain reference catalogs rather than runtime themes. Full vendor registries, morphing dialogs, marquees, bento grids, text effects, cursor effects, testimonial blocks, and premium templates were rejected because existing Rama primitives better preserve product truth, Arabic shaping, accessibility, performance, and Lagom restraint.

### Buttons and navigation

- Primary actions use ink on white or chalk, compact corners, sentence case, and a 44px default height.
- Outline actions remain quiet until hover or expanded state. Focus uses the Fjord ring with visible offset; active press may move by one pixel and must stop moving under reduced motion.
- The transparent hero header presents Rama, Method, Specimen, Boundaries, EN/AR, and one “Begin a brief” action, then settles into an ink surface after scroll. Mobile navigation preserves the same destinations and target sizes.

### Voice action and composer

- The quiet hero presents a labeled “Talk to Rama” action and an equally capable “Type instead” path beside the Rama AI signal. No form or criteria plane appears in the resting first viewport.
- Both actions open one native modal dialog; at 520px and below it becomes a bottom sheet no taller than the viewport. Escape closes it and focus returns to the opener.
- The dialog keeps its frame stable. Header, bounded status, and footer do not grow with content; transcript, typed input, criteria review, and errors scroll inside the dialog body. Textareas have fixed bounds and their own overflow, so longer input never pushes the page or dialog actions down.
- The microphone is always labeled; activity bars supplement the status text and stop under reduced motion.
- Voice phases are `idle` → `requesting` → `connecting` → `listening` (live or recorded) → `thinking` → `speaking` or `complete`.
- Error exits are permission denied, unsupported, unavailable, or connection failed. Every exit announces localized status and leaves typed recovery available.
- Voice and text converge into the same editable brief review. Preserve the transcript and draft on retry or failure.
- Brief recalculation waits 350ms, aborts stale work, accepts only the latest response, and shows a visible recalculating state. Contradictions require clarification before confirmation.
- Confirmation happens once inside the same dialog, before navigation to the Decision Room.

### Criteria slip

Render Required, Preferred, Unknown, and Contradiction as a compact definition-list plane. The first stable illustrative specimen appears below the fold in the decision-architecture section; a buyer’s working criteria appear only inside the opened dialog. Mark whether the content is an unsaved example or the buyer’s draft. Empty categories say “Not stated yet”; unknowns remain explicit and contradictions use an alert with recovery instructions.

### Evidence and boundary components

- `evidence-state` renders source confirmed, buyer confirmed, inferred, stale, disputed, and unknown with redundant text and marks.
- `boundary-ledger` presents inventory, source, consent, privacy, and data-rights boundaries as facts, not credibility badges.
- `consent-handoff` makes eligibility and consent visible. Illustrative records always render handoff unavailable.

### Decision work components

- `decision-specimen` progresses from brief → fit → evidence → open question → ledger change. It cannot invent mismatch reasons without a governed criterion-evaluation type.
- `comparison-plane` aligns governed candidates against the same brief and never fills missing facts with inferred marketing copy.
- `decision-ledger-timeline` is chronological and shows changes, unresolved questions, and time when available.
- `process-rail` uses native inline scrolling, scroll snap, and explicit previous/next controls with RTL-aware directions.

### Media frames

The active first viewport uses one original Dubai residential cityscape as decorative context, delivered through optimized AVIF/WebP desktop and portrait mobile crops with a directional legibility wash. It contains no property action, listing identity, developer mark, availability claim, or inventory label. Below the fold, the editorial image set covers climate-responsive facade, courtyard privacy, waterfront exposure, green community life, walkability and transit, spatial planning, and blue-hour waterfront context. These fictional scenes are decision prompts, not property candidates: each keeps a visible illustrative-context caption and scene-only localized alternative text. Every production asset must be optimized, hashed, registered with crop rules and ownership or generation basis, and receive documentary rights and legal review before staging.

## Do's and Don'ts

### Do:

- **Do** keep the first viewport quiet: Rama identity, one short localized heading, one supporting sentence, the Rama AI signal, and the two equivalent launch paths.
- **Do** move voice, text, criteria review, and confirmation into one bounded native dialog, and keep long content internally scrollable.
- **Do** place stable illustrative criteria proof below the fold, where it explains the method without crowding the primary action.
- **Do** make unknowns, source state, freshness, contradiction, and buyer consent visible at the decision point.
- **Do** keep voice primary and text fully equivalent through permission denial, unsupported browsers, live-session failure, recorded fallback, retry, and confirmation.
- **Do** preserve exact EN/AR content structure, logical-property mirroring, visible focus, live-region clarity, keyboard completion, Escape and focus return, and WCAG AA contrast.
- **Do** verify EN and AR at 320, 390, 768, 1024, 1280, and 1440px, plus 1280×720 and short landscape; check 44px targets, no document overflow, reduced motion, and JavaScript-failure fallbacks.
- **Do** verify release candidates with `pnpm registry:build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm e2e`, plus rendered desktop/mobile review. Staging targets remain LCP at or below 2.5s, CLS at or below 0.1, and INP at or below 200ms.
- **Do** treat staff surfaces as operational: reuse tokens and semantic evidence primitives without importing the public landing’s airy composition.

### Don't:

- **Don't** present a property grid, second composer, testimonial, rating, partner mark, award, yield, legal outcome, or live-inventory implication without approved evidence.
- **Don't** place a persistent form, transcript, criteria slip, or confirmation plane in the resting hero.
- **Don't** copy Archivanta code, CDN assets, portfolio content, motion implementation, or claims; structural pacing is the reference, not the identity.
- **Don't** use glassmorphism, gradients, generic AI orbs, pill-heavy SaaS chrome, equal feature-card walls, decorative curves, glow, or black-and-gold luxury brokerage styling.
- **Don't** add infinite marquees, uncontrolled parallax, SplitText, character-split Arabic, ambient motion outside the bounded aperture/state system, or scroll hijacking.
- **Don't** allow client state, model-authored HTML, or marketing prose to become property truth.
- **Don't** imply that architectural scene imagery depicts an available residence.

# Rama Realty Dubai Voice Search — implementation plan

Status: Address Signal direction implemented; local browser verification completed with the gstack browser runtime.

## Outcome

Replace the oversized photo-led landing page with a restrained Dubai property-discovery instrument. The first viewport becomes a generated Dubai night stage containing an overlay header, the bundled Lottie address signal, a one-line desktop headline and concise subtitle, a compact natural-language property search, and an attached voice-conversation state.

## Shared contract for both design directions

- Dark, full-viewport architectural hero; internal content rail never exceeds 1200px including gutters.
- Desktop gutters 40px, tablet 28–32px, mobile 20px.
- Hero occupies the viewport minus the first 64px evidence strip and remains auto-growing, so the voice panel can never be clipped.
- Hero heading no larger than 3.85rem and resolves to one visual line at 1280px and above, then wraps deliberately below the desktop breakpoint.
- Search rail never exceeds 520px and retains that width while voice opens beneath it.
- Square geometry and ruled planes; no decorative hero corner rules, stock-photo hero, curved decorative lines, floating chat launcher, glassmorphism, or pill controls.
- Text is a complete alternative to voice.
- Three illustrative Dubai property cards only, with AED prices and visible match reasons.
- Methodology becomes a compact evidence ledger; the closing CTA and footer remain restrained.

## Direction delta

### A — The Address Signal (approved, centered composition)

The bundled Lottie signal, heading, subtitle, search rail, and attached voice panel form one centered editorial column below the overlay header. The signal is the only voice trigger: static at idle, active during the session, and direct-starting Live on one deliberate action. The voice panel is absent at idle and expands beneath the unchanged-width search.

### B — Dubai Address Desk (not selected)

The hero uses a 1200px lower-third grid. The search rail occupies about 760px and the active voice panel extends it by about 360px. Below 1024px the panel moves directly beneath the search. It remains closed by default and enters the layout only after deliberate microphone activation.

## Component changes

### `components/landing-page.tsx`

- Read search, favorite, dialog, and voice presentation state through focused Zustand selectors.
- Keep microphone streams, timers, and focus-return elements as component-owned refs.
- Replace the old image hero with the centered `VoiceSignal`, search, and `VoiceConversation` compositions over the generated Dubai night background.
- Change the sample brief and criteria parser to Dubai/AED language.
- Keep deterministic prototype behavior and explicit illustrative disclosures.
- Keep all `MediaStream` tracks stopped on cancel, completion, error, and unmount.

### `components/voice-conversation.tsx`

New client component driven by a discriminated state contract so transcript, live announcements, controls, and animation cannot drift independently:

- `idle`: panel closed; Lottie static.
- `requesting`: panel open; permission status; Lottie playing.
- `listening`: panel open; live/sample transcript; Lottie playing; Stop available.
- `complete`: panel open briefly with extracted criteria; Lottie paused.
- `error`: panel open with recovery copy and text fallback; Lottie paused.

The signal uses `aria-live="polite"`, exposes an accessible Stop/Cancel path through the attached conversation, and loads `public/lottie/ai.json` through a client-safe Lottie renderer installed with pnpm. A square CSS signal covers loading or renderer failure. The Lottie is static at idle and for reduced-motion users, then moves only while voice is active.

Before requesting a stream, query the browser permission state when supported. A known denial goes directly to the text fallback. Do not persist a separate denial flag in local storage because browser permission remains authoritative and may change independently.

### `components/site-header.tsx`

- Overlay the architectural stage with inverse logo/navigation.
- Cap height at 72px.
- Preserve the React Aria menu button and semantic navigation.
- Use a solid midnight mobile menu rather than a blur or floating sheet.

### `components/site-footer.tsx`

- Retain the prototype disclosure.
- Update labels to the approved Dubai search language.
- Reduce vertical height and align to the same 1200px rail.

### `lib/sample-properties.ts`

- Replace Miami records with three clearly illustrative Dubai residences.
- Use Dubai Marina, Downtown Dubai, and Palm Jumeirah or Jumeirah.
- Use AED prices and locally plausible metric/imperial facts without implying live inventory.

### `app/globals.css`

- Replace `--page-gutter` and `--section-space` with the controlled responsive scale.
- Change `.section-shell` from a 90rem shell to a box-sizing-safe 1200px rail.
- Replace the photo/scrim rules with the optimized generated Dubai night image, restrained contrast overlays, no decorative corner rules, and a centered viewport composition.
- Put current criteria in a thin paper summary band after the hero so the idle first viewport remains legible.
- Define the layer contract explicitly: image `0`, contrast scrim `1`, hero content `2`, overlay header `3`.
- Reduce section headings and section padding.
- Add attached voice-panel states and Lottie wrapper rules.
- Preserve visible focus, square geometry, and reduced-motion behavior.

### `app/layout.tsx`

- Update metadata from generic/Miami language to Dubai property discovery.
- Change `themeColor` if the hero overlay treatment requires it.

### Dependencies

- Add the selected classic-Lottie React renderer using `pnpm add` only.
- Use Zustand for bounded client interaction state; create the store per page tree and keep server/property truth outside it.
- No npm command, npm lockfile, animation framework, carousel, shader, or glass-effect package.

## Evidence ledger content

The methodology ledger is a truthful product preview, not a market-statistics claim:

1. **What you said** — the current text or illustrative voice brief.
2. **What Rama understood** — editable location, budget, bedrooms, property type, and lifestyle criteria.
3. **Why these homes appeared** — a visible match reason for each local sample result.
4. **Source status** — illustrative local data; no live listing or market-data feed is connected.

## Width implementation

Use a centered 1200px rail with explicit viewport gutters. Avoid typed-arithmetic-style multiplication inside `calc()`, which invalidated the earlier declaration in browsers:

```css
.section-shell {
  width: calc(100% - var(--page-gutter) - var(--page-gutter));
  max-width: 75rem;
  margin-inline: auto;
}
```

The rail reaches 1200px when the viewport can accommodate it and contracts to preserve the responsive gutters at narrower widths without horizontal overflow.

## Verification matrix

| Requirement | Evidence |
| --- | --- |
| pnpm only | `packageManager`, lockfile inventory, install command, `pnpm check` |
| Full Dubai hero | Rendered Chrome screenshots at 1280 and 1440 |
| Viewport fit | Chrome checks at 320, 390, 768, 1024, 1280, 1440; `scrollWidth === innerWidth` |
| Controlled content width | Computed bounding boxes never exceed the 1200px contract |
| Voice icon and panel | Keyboard and pointer activation in Chrome; open/listen/stop/error states |
| Lottie behavior | Plays only while requesting/listening; pauses at idle/complete; static under reduced motion |
| Text fallback | Search submits and updates criteria with microphone unavailable or denied |
| Accessibility | Heading order, labels, live region, focus visibility, 44px targets, Escape dialog close |
| Reduced motion | Chrome emulation confirms no masks/transforms or looping Lottie |
| Build quality | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` |

## Implemented direction

The Address Signal direction is implemented with a collapsed-by-default voice panel beneath the unchanged-width search. The design uses a midnight, ivory, sand, and muted-brass palette; the optimized generated Dubai night background; a centered 1200px rail; a static-at-idle 224–300px Lottie signal with softened edges; a one-line desktop hero heading; a compact 520px by 46px search instrument; a full-viewport hero height contract; no decorative hero corner ornaments; and a separate brief-summary band. Local hydration, Lottie delivery, direct voice activation, text search, 390px/1440px overflow checks, contract tests, lint, typecheck, and production build are the implementation gates.

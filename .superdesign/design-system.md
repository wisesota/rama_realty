# Rama Realty — Editorial Property Atelier

## Product context

Rama Realty is a voice-led Dubai property-discovery experience. Buyers can speak or type a
natural-language brief, review the criteria Rama extracted, and understand why illustrative
residences appeared. Voice and text are equal paths into the same search. Property inventory,
prices, and match reasons remain explicitly illustrative until licensed supply is connected.

Primary job: let a buyer begin a useful Dubai property search in the first viewport, then carry
that brief into an editorial property narrative without losing source status or match context.

## Visual thesis

Direction: **Editorial Property Atelier**.

The page borrows the spatial grammar of a contemporary architecture studio: a slim navigation
bar, one generous inset architectural hero, oversized brand typography, compact image and data
strips, asymmetric property compositions, pale gallery surfaces, and a monumental wordmark
footer. It must feel authored and architectural, never like a SaaS dashboard or component demo.

The memorable moment is the working Rama voice signal and search instrument inside the hero.
The editorial redesign frames that interaction; it does not alter the voice, search, Zustand, or
API contracts.

## Behavior invariants

- Keep `VoiceSignal` as the deliberate voice activation control.
- Keep `public/lottie/ai.json` as the voice artwork and state signal.
- Keep the voice panel absent at idle and attached below the unchanged-width search rail.
- Keep text search available in every voice state.
- Keep the existing Gemini Live, recorded-turn, property-search, Zustand, focus-return, and
  reduced-motion behavior.
- Keep criteria, source status, prices, and property match reasons visible and editable.
- Never imply live MLS, valuation, CRM, or market-data connectivity.

## Information architecture

1. **Header and hero atelier** — slim three-zone header; inset Dubai media stage; oversized Rama
   wordmark; Lottie voice signal; one-line statement; search instrument; attached voice state.
2. **Current brief strip** — compact status, extracted criteria, source disclosure, and saved brief.
3. **Buyer context** — an asymmetric editorial introduction with factual product measures:
   one brief, three illustrative samples, zero live feeds.
4. **Curated residences** — three properties in a lead-plus-supporting editorial composition.
5. **Rama services** — voice discovery, editable criteria, explained matches, and saved briefs.
6. **Signature residence** — one panoramic property composition with a floating factual dossier.
7. **Decision path** — speak or type, review, compare, and save; followed by a restrained mosaic.
8. **Trust ledger** — privacy, source status, and match explanation instead of invented reviews.
9. **FAQ and closing** — concise questions, paired architectural imagery, and a large wordmark footer.

Do not reproduce blank bands visible in long-page capture references. Use controlled section
rhythm or a real sticky composition only when it carries information.

## Typography

- Display/editorial: Source Serif 4, Georgia fallback, weights 450–600.
- UI, wordmark, and labels: Instrument Sans, sans-serif fallback, weights 400–800.
- Hero wordmark: uppercase, 800 weight, `clamp(4.5rem, 11vw, 10.5rem)`, line-height 0.76–0.84,
  tracking around -0.065em.
- Hero statement: Source Serif 4, `clamp(2.3rem, 4vw, 4rem)`, one line on wide desktop.
- Section headings: Source Serif 4, `clamp(2.2rem, 4vw, 4.5rem)`, line-height 0.96–1.04.
- Body: 1rem minimum, 1.55–1.7 line-height, maximum 62ch.
- Metadata: 0.78rem minimum, uppercase only for short labels.
- Use two font families only. Do not restore Inter, system UI, or a decorative third face.

## Color

- Gallery paper: `#FBFBF8`.
- Raised white: `#FFFFFF`.
- Architectural gray: `#F0F1F1`.
- Mist: `#E7EBEC`.
- Ink: `#202321`.
- Body: `#585D5B`.
- Quiet: `#747A77`.
- Dubai sky: `#82B8D7`.
- Sky wash: `#DDECF4`.
- Sand: `#B99463`.
- Rule: `#D8DAD8`.
- Error: `#A34132`.
- Focus: `#1D5D7A` on paper and `#FFFFFF` on imagery.

Use sky blue as the brand atmosphere and sand only for precise accents. Primary actions use ink,
not gradients. No purple, neon, glass, metallic simulation, or heavy chromatic glow.

## Geometry and elevation

- Media radius: 16px desktop, 12px tablet, 10px mobile.
- Content panel radius: 10px.
- Controls: 6–8px; never apply one bubbly radius to every element.
- True pills are reserved for small location or source tags only.
- Border: 1px architectural rules.
- Default shadow: none.
- Floating dossier: one restrained shadow, no blur-heavy glass.

## Layout

- Editorial rail: `min(100% - 48px, 1280px)`; mobile gutters 20px.
- Hero: inset within the rail, `min-height: calc(100svh - header - 24px)`, auto-growing during
  voice activity so controls never clip.
- Desktop grid: 12 columns. Tablet: 8. Mobile: 4.
- Desktop section rhythm: 112–144px. Tablet: 88–112px. Mobile: 64–88px.
- Prefer asymmetric lead/supporting compositions over repeated equal cards.
- One purpose per section; copy and metadata align to real media edges.

## Header

- 58–64px tall on a paper background, not overlaid on the hero.
- Logo left, Dubai context centered, navigation and one compact CTA right.
- Mobile uses a React Aria Sheet with an explicit menu button and solid paper surface.
- All actions keep a minimum 44px effective target.

## Hero atelier

- Use the existing generated Dubai architecture asset until a new approved local set exists.
- Place the oversized `RAMA REALTY` wordmark across the upper image field as the brand anchor.
- Keep the real Lottie voice signal centered in a dedicated 208–280px stage.
- Put the existing one-line hero statement and compact search instrument below the signal.
- Preserve the search input, submit action, privacy copy, and attached conversation panel.
- Keep legibility with restrained directional overlays only; no decorative blobs or corner rules.

## Property presentation

- Three illustrative Dubai residences only.
- Use one lead residence spanning the primary grid area and two supporting residences.
- Each property keeps location, AED price, facts, illustrative status, and match reason.
- Cards are media-led editorial dossiers, not padded SaaS cards.
- Favorite and detail interactions retain React Aria semantics.
- The signature residence reuses a current result and opens the same accessible detail dialog.

## Shadcn and component system

- Base: React Aria, style `aria-lyra`, Lucide icons, pnpm only.
- `components/ui/*` contains shadcn primitives.
- `components/rama/*` contains branded compositions.
- `components/landing/*` contains page sections.
- Required primitives: Button, Input Group, Dialog, Sheet, Accordion, Item, Badge, Separator,
  Aspect Ratio, and Skeleton after the Aria implementation is inspected.
- A local source registry publishes Rama compositions such as section shell, editorial heading,
  media frame, hero instrument, brief strip, property dossier, evidence ledger, FAQ, and footer.
- Do not create page-local copies of buttons, tags, dialogs, accordions, or media frames.

## Motion

- Initial hero reveal: brand wordmark and main instrument enter over 500–700ms.
- Media masks: one-time 450–650ms reveal when a section first enters.
- Voice panel: existing 180–240ms attached vertical reveal.
- Property images: restrained 1.02–1.035 scale on hover.
- No perpetual motion outside active voice playback.
- `prefers-reduced-motion` removes transforms, masks, and Lottie playback.

## Accessibility and state coverage

- Body copy never falls below 16px; touch targets are at least 44×44px.
- Maintain visible focus, labels outside placeholder-only fields, `aria-live`, Escape handling,
  focus return, and complete text alternatives to voice.
- Specify and render idle, loading, empty, error, partial, success, permission-denied, listening,
  thinking, speaking, and complete states.
- Maintain WCAG AA contrast against every image crop and surface.

## Responsive acceptance

- 1440/1280: inset hero, one-line statement, full wordmark, lead-plus-supporting property grid.
- 1024: reduce wordmark and mosaic depth without shrinking body copy.
- 768: eight-column editorial layout, two-column properties, compact header menu.
- 390/320: four-column rail, intentionally reordered content, single-column properties, no
  horizontal overflow, document-flow voice panel, reachable controls on short screens.
- Short landscape: hero grows beyond the viewport rather than clipping the search or voice panel.

## Content integrity

- No fabricated years, project counts, satisfaction percentages, testimonials, awards, or reviews.
- Replace testimonial patterns with the trust ledger until genuine verified quotes exist.
- Publish journal or market content only with named authorship and sources; otherwise omit it.
- Keep every residence, price, match, and data-source status visibly illustrative.

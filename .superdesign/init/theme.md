# Theme and design tokens

## Foundation

- Next.js 16, React 19, TypeScript, Tailwind 4.
- shadcn aria-lyra preset with React Aria Components and Lucide.
- Source Serif 4 display type and Inter body/UI type.
- Global visible radius `0`; only the intrinsic listening-status dot is circular.

## Palette

- Paper `#F4F1EA`, raised paper `#FBFAF6`, stone `#E8E3D8`, rule `#D4CFC3`.
- Ink `#20241F`, body `#535951`, quiet `#737A71`.
- Forest `#143E32`, hover `#1D5141`, sage `#819688`, clay `#B66F53`.
- White `#FFFFFF`, paper focus `#2D705D`, hero focus `#B9D8CC`.

## Implemented scale

- Inner content maximum: 1200px (`75rem`).
- Outer shell includes responsive gutters: 40px desktop, 32px compact desktop, 28px tablet, 20px mobile, 16px at 352px and below.
- Hero: 720–900px on desktop, natural-height 752–768px minimum on tablet/mobile.
- Search maximum: 880px (`55rem`); it never shrinks when voice opens.
- Hero heading: `clamp(3rem, 5.4vw, 5.25rem)`; mobile cap 4rem.
- Section heading: `clamp(2.25rem, 3.7vw, 3.6rem)`.
- Section rhythm: `clamp(4.25rem, 7vw, 6rem)`, reduced to 4rem mobile.

## Image and layering

- Dubai photograph layer `0`, one forest/black contrast scrim layer `1`, hero content layer `2`, header layer `30`.
- Photography is slightly desaturated; no parallax, glass, decorative gradient, or floating overlay.

## Responsive structure

- 1200px+: three property columns.
- 900–1199px: two columns with the third card constrained beneath.
- 768px and below: one property column; voice actions move below the transcript.
- 640px and below: search submit becomes a full-width second row; no horizontal overflow.

## Motion and accessibility

- One hero entrance, one attached voice-panel entrance, restrained hover translations, and active-only voice bars/Lottie.
- `prefers-reduced-motion` collapses transitions/animations and the voice component shows a static microphone.
- All icon controls have labels; focus uses a visible 2px ring; targets are at least 44px.

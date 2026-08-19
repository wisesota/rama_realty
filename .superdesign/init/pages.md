# Page dependency trees

## `/` — Rama Realty Dubai landing page

Entry: `app/page.tsx`

Dependencies:

- `components/landing-page.tsx` — Dubai query parsing, microphone permission demo, hero, property cards, evidence ledger, CTA, and modal.
- `components/voice-conversation.tsx` — lazy Lottie renderer and requesting/listening/complete/error panel.
- `components/site-header.tsx` and `components/site-footer.tsx` — shared layout.
- `components/logo.tsx` — brand asset.
- `components/ui/button.tsx` — React Aria buttons and links.
- `lib/sample-properties.ts` — three clearly illustrative Dubai sample records.
- `app/globals.css` — complete responsive visual implementation.
- `public/lottie/ai.json` — 4,804,302-byte Lottie composition; rendered by the hero voice signal with a reduced-motion fallback.
- `public/images/rama-hero-dubai-night.webp` — 74,962-byte optimized hero background derived from the generated 1,586,215-byte PNG source.

Rendered content:

1. Full-bleed Dubai photograph with overlay header, restrained headline/subtitle, 880px text search, integrated microphone action, collapsed-at-idle voice panel, ruled criteria, and prototype disclosure.
2. Three compact sample search results for Dubai Marina, Downtown Dubai, and Palm Jumeirah.
3. Paper evidence ledger showing buyer words, extracted criteria, match reasons, and source status.
4. Short forest CTA followed by the compact brokerage footer.

The voice prototype requests browser permission but does not transcribe, upload, or retain audio. A timer completes the clearly illustrative sample turn.

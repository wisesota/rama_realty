---
target: Rama Realty localized landing page
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-23T10-43-15Z
slug: app-locale-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key issue |
| --- | --- | ---: | --- |
| 1 | Visibility of system status | 2 | Voice and confirmation states are thoughtful, but short briefs fail without visible feedback. |
| 2 | Match system / real world | 3 | Desire-led language works; governed, source boundary, and Decision Room require interpretation. |
| 3 | User control and freedom | 3 | Confirmation and mobile navigation have exits; the preloaded example is not clearly resettable user state. |
| 4 | Consistency and standards | 3 | Begin, Shape, and Search name the same progression differently. |
| 5 | Error prevention | 2 | Confirmation prevents opaque persistence; initial short-input validation is silent. |
| 6 | Recognition rather than recall | 3 | Criteria stay visible, but the mic label nearly disappears against the photograph. |
| 7 | Flexibility and efficiency | 3 | Voice, text, Enter, and editable confirmation support multiple paths. |
| 8 | Aesthetic and minimalist design | 3 | Calm editorial system; duplicated CTAs and repeated boundary copy add noise. |
| 9 | Error recognition and recovery | 2 | API fallback copy preserves work, but short briefs receive no diagnosis. |
| 10 | Help and documentation | 2 | Inline disclosure exists; microphone permission and privacy expectations are not explained before activation. |
| **Total** |  | **26/40** | **Acceptable** |

## Design Specificity Verdict

Rama feels authored, but not yet unmistakable. Source Serif 4, restrained daylight architecture, the inspectable confirmation stage, and explicit inventory boundaries belong to this product. The full-bleed premium-villa hero and dominant typed Search control still read like a conventional luxury-property portal, while the defining voice concierge is visually demoted.

The deterministic scan returned zero findings for `app/[locale]/page.tsx`. This is not a contradiction: the priority issues are rendered hierarchy, content sequencing, state feedback, and responsive composition rather than syntactic anti-patterns. Browser mutation was read-only, so no reliable overlay was injected.

## Overall Impression

The product has an unusually honest, calm, and inspectable discovery foundation. Its strongest moment is the editable `Is this what you mean?` confirmation. Its biggest opportunity is to make voice, evidence, and buyer confidence feel like the product, rather than letting Search and repeated prototype limitations define the experience.

## What's Working

- `Describe the life you want in Dubai` moves users from portal filters toward an advisory relationship.
- The editable brief and labelled inferred criteria make AI interpretation inspectable before anything is saved.
- Illustrative-inventory and advisor-consent boundaries avoid fabricated confidence.

## Priority Issues

1. **[P1] Voice is visually subordinate to typed Search.** The mic and voice label lose contrast over the hero while Search and Begin dominate. Make the voice hub the clearest primary action and present typed search as the alternative. Suggested command: `$impeccable layout`.
2. **[P1] Short briefs fail silently.** The field regains focus without visible or accessible explanation. Add an inline minimum-brief message connected through `aria-describedby` and `aria-invalid`. Suggested command: `$impeccable harden`.
3. **[P1] Mobile navigation mixes buyer and staff concerns.** Begin is duplicated, Shape/Search/Begin conflict, and Staff login interrupts the buyer path. Reduce the menu to one buyer CTA, the decision method, and language switching. Suggested command: `$impeccable distill`.
4. **[P2] The prefilled example looks like user-owned state and truncates at common phone widths.** Use an empty field or visibly labelled example and rebalance the 375–430px control. Suggested command: `$impeccable adapt`.
5. **[P2] Governance copy repeats instead of demonstrating the method.** Keep one boundary near submission and the legal footer; use the trust section to show the inspect-confirm-decide journey. Suggested command: `$impeccable clarify`.

## Persona Red Flags

**Jordan, first-timer:** Cannot immediately choose between Begin, voice, and Search; encounters novel terms without plain-language definitions; receives no explanation for a short rejected brief.

**Riley, stress tester:** One-character submissions are silently ignored; the initial five-criteria status appears before the visitor has acted; long requests become hard to inspect on phones.

**Casey, distracted mobile buyer:** The key CTA stays at the top edge; opening navigation duplicates actions; the compact search row hides much of the request at 390px.

**Nadia, cross-border investor:** Governance is asserted more often than demonstrated; voice-data handling is unclear before activation; the landing does not preview the evidence depth delivered by the Decision Room.

## Minor Observations

- The desktop hero heading correctly stays on one line and wraps cleanly on mobile.
- The green Gemini Live dot resembles generic AI status chrome.
- `The landing page is the invitation` describes product architecture more than buyer value.
- Confirmation criteria are well chunked once reached.

## Questions to Consider

- If voice is Rama's moat, why is the microphone the least legible action?
- What would remain if Begin, Shape, and Search became one consistent verb?
- Could governance be demonstrated as an inspectable three-step method rather than repeated as a disclaimer?
- Should a first visit start with an empty canvas or a clearly labelled example?

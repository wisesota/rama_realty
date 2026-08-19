# Extractable components

## `SiteHeader`

- Source: `components/site-header.tsx`
- Layout component already represented on the Rama Realty canvas.
- Full-bleed hero overlay with inverse Logo, two anchors, one light CTA, and a square React Aria mobile-menu control.

## `SiteFooter`

- Source: `components/site-footer.tsx`
- Compact dark brokerage footer already represented on the Rama Realty canvas.
- Contains inverse Logo, two link groups, and the explicit illustrative-data disclosure.

## `Logo`

- Source: `components/logo.tsx`
- Basic reusable brand component with normal and inverse states.

Do not extract `VoiceConversation` as a static DraftComponent: its layout and copy are coupled to requesting, listening, complete, and error states that remain clearer in target-page source context.

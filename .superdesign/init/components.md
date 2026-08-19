# Shared UI components

## `Logo`

Source: `components/logo.tsx`. Rama doorway mark plus serif/sans wordmark. The `inverse` prop supplies the white overlay/footer treatment.

## `Button` and `LinkButton`

Source: `components/ui/button.tsx`. React Aria primitives generated from the shadcn aria-lyra preset. Variants use CVA and the global square-radius contract.

## `VoiceConversation`

Source: `components/voice-conversation.tsx`. A client-only, collapsed-at-idle panel driven by the discriminated `VoiceExperienceState`. It lazy-loads the named `Lottie` export from `lottie-react`, renders `/lottie/ai.json` as the hero signal, and falls back to a CSS pulse or static microphone under reduced motion.

Visual contract: exact search width, square paper plane, 96px-or-smaller animation cell, transcript, status, stop/close control, and text fallback. It is never a floating chat bubble or permanent sidecar.

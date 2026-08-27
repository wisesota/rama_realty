# [HISTORICAL] Rama Realty: Vellaro Design Implementation

> [!WARNING]
> This document is historical. The active design direction is the "Nordic Decision Desk" as defined in `docs/designs/nordic-decision-desk-redesign-brief.md`.

## Overview
This document details the transition from the legacy "Nordic Lagom" minimalist aesthetic to the high-contrast, editorial "Vellaro" art direction. It is retained for historical reference of the token architecture it introduced, but the UI is now aligned with the Nordic Decision Desk requirements.

The core of this implementation relies on **Tailwind CSS utilities** coupled with an expanded design token architecture in `app/globals.css`, fully eliminating the previous reliance on custom, tangled CSS classes (`.vellaro-*` and `.realtifye-*`).

## Core Principles

1. **Dual-Typography Branding**
   - **Instrument Sans (`font-sans`)**: Used for functional UI, metrics, uppercase tracking metadata, and structural headers. Conveys precision and modernity.
   - **Source Serif 4 (`font-heading`)**: Deployed strategically for brand identity, large numerical stats, and italicized accents (e.g., *full service support*). Conveys heritage, institution, and luxury.
2. **Atmospheric Dark Mode & High Contrast**
   - The primary palette pivots around `var(--rama-ink-dark)` (deep charcoal/black) and `var(--rama-ivory)` (warm off-white).
   - Sections intentionally alternate between these extremes (e.g., dark Hero $\rightarrow$ dark Communities $\rightarrow$ light Curated Projects) to create editorial pacing.
3. **Glassmorphism & Depth**
   - Implemented via `backdrop-blur-*` utilities and translucent borders (`border-white/20`).
   - The "Decision Room" search interface uses frosted glass layers over the hero image to maintain context while focusing user intent.
4. **Architectural Grids & Spacing**
   - Extended viewports (e.g., `100svh` hero) create an immersive canvas.
   - Generous padding (`py-24` or `py-32`) allows elements to breathe.

## Global Token Architecture (`app/globals.css`)

The legacy custom CSS rules were replaced with inline Tailwind theme configurations (`@theme inline`) and specific CSS variables.

### Key Tokens
- `--rama-ivory`: `#F8F3ED` (Warm, premium paper tone)
- `--rama-ink-dark`: `#111827` (Deepest charcoal/black for backgrounds)
- `--rama-glass-bg`: `rgba(255, 255, 255, 0.12)` (Search interface background)
- `--rama-glass-border`: `rgba(255, 255, 255, 0.22)`
- `--rama-sand`: `#b99463` (Accent color)

### The Hero Veil
To achieve the Vellaro-style atmospheric depth over the main imagery, a custom linear-gradient class was retained:
```css
.hero-veil--vellaro {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(10, 15, 20, 0.55) 0%,
    rgba(10, 15, 20, 0.20) 35%,
    rgba(10, 15, 20, 0.40) 65%,
    rgba(10, 15, 20, 0.80) 100%
  );
  backdrop-filter: blur(1px);
}
```

## Component Implementation Details

### 1. Site Header (`components/site-header.tsx`)
- **Action:** Stripped out custom `.vellaro-contact-meta` and `.vellaro-brand-text` classes.
- **Implementation:** Rebuilt using Flexbox/Tailwind grids.
- **Styling:** The header floats cleanly with a transparent background that blurs the content beneath it. The "Rama Realty" lockup explicitly maps to `font-heading` for "Rama" and tracked `font-sans` for "Realty".

### 2. Landing Page Hero (`components/landing-page.tsx`)
- **Action:** Removed `.hero-stage` and nested `.vellaro-*` custom classes.
- **Implementation:** 
  - The hero is forced to `h-[100svh]` to ensure a full-screen cinematic entry.
  - Added a "REAL ESTATE" ghost watermark using `text-[18vw] leading-[0.8] opacity-40 mix-blend-overlay`.
  - The Search Interface is a glassmorphic container (`bg-[var(--rama-glass-bg)] backdrop-blur-xl border-white/20`).
  - Stats bar at the bottom uses `font-heading italic text-4xl` to highlight key metrics.

### 3. Community Cards (`components/archivanta/archivanta-communities.tsx`)
- **Action:** Removed `.realtifye-dark-section` and `.community-card`.
- **Implementation:** 
  - Dark-mode background (`bg-[var(--rama-ink-dark)]`).
  - Snap-scroll track using Tailwind `overflow-x-auto snap-x`.
  - Cards feature a `4/5` aspect ratio with hover scaling (`group-hover:scale-105`) and an ivory gradient overlay for text readability.

### 4. Property Cards (`components/archivanta/archivanta-projects.tsx`)
- **Action:** Transitioned from a dark theme to a high-contrast Ivory theme to break up the pacing.
- **Implementation:**
  - Background set to `bg-[var(--rama-ivory)]`.
  - Grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
  - Card images use `aspect-[4/3]` with a floating status badge.
  - Typography is inverted: deep charcoal text (`text-[var(--rama-ink-dark)]`) on light backgrounds.

## Verification & QA
- **Type Safety:** `pnpm typecheck` passes (0 errors).
- **Linting:** Modified files (`landing-page.tsx`, `archivanta-communities.tsx`, `archivanta-projects.tsx`) pass ESLint strictly.
- **Build Status:** `pnpm build` completes successfully.

This architecture ensures the UI is entirely scalable and avoids CSS specificity conflicts. Its token system remains the foundation of the active Nordic Decision Desk implementation.

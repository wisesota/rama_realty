# Rama Realty — Nordic Decision Desk redesign brief

**Status:** research input; superseded for section count and long-form pacing by `rama-decision-architecture-redesign.md`. Product truth, competitor research, and Nordic principles remain active.  
**Prepared:** 23 August 2026  
**Scope:** public landing, brief review, Buyer Decision Room, saved decisions, and staff-facing continuity  
**Product source of truth:** governed voice-first Dubai Buyer Decision OS

## Executive decision

Rama should stop presenting itself as a luxury property gallery with a voice widget. The new
experience will be a **Nordic Decision Desk**: calm, exact, materially warm, and organized around
the work of making a defensible cross-border property decision.

The visual system will borrow the best qualities of Nordic civic and service design—coherence,
accessibility, obvious state, disciplined typography, and quiet confidence—while retaining a
specific Dubai material context. It will not reproduce a Scandinavian lifestyle mood board or
erase the market Rama serves.

The product distinction is structural:

```text
Portal or developer site                  Rama
------------------------                  ----
inventory first                           buyer brief first
filters and listing volume                criteria and unknowns
property glamour                          decision evidence
lead form                                 consented continuity
current listing state                     as-seen record and change history
```

## Research method and limits

Research was performed with Firecrawl against official or primary web pages on 23 August 2026.
The multi-source Firecrawl agent was unavailable because the configured connection does not expose
an authenticated research key, so the audit used synchronous Firecrawl search and page scrapes.
Bayut's homepage returned a CAPTCHA to direct scraping; only the indexed Firecrawl search result
was used for Bayut. Competitor observations describe the retrieved public surfaces, not the full
company or product.

Primary Nordic references:

- [Sweden's official visual-identity design principles](https://sharingsweden.se/the-sweden-brand/brand-visual-identity/design-principles)
- [Norway's Designsystemet principles](https://designsystemet.no/en/intro/about-the-design-system/)
- [Aksel, NAV's design system](https://aksel.nav.no/)

Primary Dubai category references:

- [Property Finder](https://www.propertyfinder.ae/)
- [Bayut](https://www.bayut.com/)
- [Engel & Völkers Dubai](https://www.engelvoelkers.com/ae/en)
- [Betterhomes](https://www.bhomes.com/)
- [Driven Properties](https://www.drivenproperties.com/)
- [Emaar](https://www.emaar.com/)
- [DAMAC](https://www.damacproperties.com/en/)

## What Nordic Lagom means for this product

“Nordic” is not white walls, beige photography, or a sparse page by itself. The official systems
make a stronger case:

| Principle | Source signal | Rama application |
| --- | --- | --- |
| Coherence | Designsystemet emphasizes coherent, reusable services and adaptable themes | One token system and one interaction grammar across landing, room, account, and dashboard |
| Quality | Designsystemet pairs component quality with accessibility and user needs | Every state is legible; no interaction relies on animation, audio, or color alone |
| Trust | Designsystemet names trust as a foundation | Sources, dates, assumptions, unknowns, and consent are first-class interface objects |
| Simplicity | Sharing Sweden recommends few identity carriers, generous type space, and grid structure | One promise, one primary action, one meaningful demonstration per section |
| Context | Sharing Sweden calls for adapting expression to subject complexity | Quiet landing; denser but ordered Decision Room; no uniform marketing-page treatment |
| Good practice | Aksel centers universal design, user insight, tokens, and practical guidance | Accessibility and evidence semantics shape the component API, not a final QA pass |

Lagom therefore means **enough information to decide, no ornament pretending to be information**.

## Current UI audit

The supplied capture and current source show a coherent implementation of the wrong visual idea.

### Hero

1. The full-bleed villa image, dark veil, white serif headline, and centered composition signal a
   premium brokerage campaign. They do not signal an inspectable decision tool.
2. The large dark voice block floats as a separate AI appliance. It competes with the buyer's job
   instead of demonstrating how voice becomes structured criteria.
3. The headline, subtitle, voice label, input label, status copy, input, button, disclosure, and
   bottom metadata all compete inside one viewport. The result is hierarchy by accumulation.
4. The pulsing green dot, dark glass-like search rail, and image overlay contradict the documented
   prohibition on decorative AI indicators, glass effects, and a dark full-screen baseline.
5. The visual promise is “beautiful Dubai property”; the product promise is “I can defend this
   decision.” The former is already owned by developers and brokers.

### Page depth and sections

1. The landing currently has only a hero, a three-statement method block, and a footer. It explains
   the mechanics but never demonstrates the distinctive decision artifact.
2. The method section uses a large editorial heading and three long statements, producing a broad
   empty band rather than a useful progression.
3. There is no visual example of criteria, assumptions, mismatches, evidence freshness, comparison,
   or the Decision Ledger—the product's actual moat.
4. The oversized footer wordmark consumes more space than the trust and provenance explanation.
5. The black circular “N” controls visible in the capture appear to be development overlays rather
   than product UI; they must never enter release screenshots or production.

### Typography and layout

1. The serif is doing both emotional and instructional work. Long italic copy on an image loses the
   plain-spoken quality expected of a Nordic service.
2. Center alignment is overused. Decision work benefits from a stable left edge, scanable labels,
   and aligned values.
3. Uppercase tracking is used across navigation, labels, metadata, and actions, flattening emphasis.
4. The page alternates between compressed hero content and under-filled white space rather than
   maintaining a measured sectional rhythm.

### Documentation drift causing the visual drift

The repository currently documents three incompatible design worlds:

- `PRODUCT.md` prioritizes high-net-worth luxury, editorial presentation, and “verified reviews,”
  even though reviews and success metrics are not approved claims.
- `.superdesign/design-system.md` defines Editorial Property Atelier and a nine-section historical
  landing architecture that no longer matches the route-first public boundary.
- `docs/design-implementation.md` explicitly describes a transition away from Nordic Lagom toward
  Vellaro, including frosted glass and a cinematic full-screen hero.
- `docs/JUMPING_THE_CURVE_CTO_PLAN.md`, `AGENTS.md`, and the claims registry define the current
  product truth: route-first Decision OS, no invented supply or credibility, restrained Nordic
  Lagom, and a landing limited to invitation, brief entry, and source/privacy explanation.

The latter group governs this redesign. Historical Vellaro, Archivanta, and Atelier documents are
inputs, not active direction.

## Competitive interface audit

| Surface | What the public homepage leads with | Useful pattern | Pattern Rama should avoid | Opportunity for Rama |
| --- | --- | --- | --- | --- |
| Property Finder | Buy/rent/invest search, filters, communities, projects, transactions, mortgages | Fast familiar search and market utility | Competing on breadth, filter count, or listing scale | Explain what the market data means for one buyer's decision |
| Bayut | Large marketplace, popular sale/rent searches, area and transaction utilities; AI search is already category-visible | Strong discovery coverage and familiar taxonomy | Treating natural-language or AI search as a moat | Preserve the brief, evidence, and reasoning after search |
| Engel & Völkers | Luxury property imagery, preferred locations, valuation/advisory conversion, editorial content | Controlled white space and clear service paths | Generic luxury editorial and global-network credibility language | Make trust inspectable rather than reputational |
| Betterhomes | Buy/rent/off-plan/property management, location search, expert/valuation conversion | Broad lifecycle coverage and direct human path | Agency-first funnel and statistics/testimonials as proof | Let buyers build evidence before a consented handoff |
| Driven | Listings, areas, news, market insights, call/WhatsApp conversion | Area context beside inventory | Immediate lead conversion and superlative positioning | Connect area context to explicit criteria and trade-offs |
| Emaar | Developer inventory, community storytelling, filters, 360-degree tours, consultation | Strong project storytelling and community navigation | Cinematic imagery as sufficient decision support | Compare options across developers and expose unknowns |
| DAMAC | Branded luxury projects, offers, locations, testimonials, corporate scale | Strong brand recognition and project hierarchy | Black/gold luxury codes, promotional urgency, partnership spectacle | Quiet, buyer-aligned independence and evidence provenance |

The category clusters around three models: portal utility, developer spectacle, and broker
reputation. Rama should own a fourth: **buyer-controlled decision assurance**.

## Product-wide information architecture

### 1. Public landing — invitation and proof of method

The landing remains short. It should contain five purposeful sections, not a catalog:

1. **Decision Desk hero** — promise, text/voice brief composer, visible state, and a criteria-preview
   specimen.
2. **What Rama makes visible** — a single annotated decision strip showing requirement, evidence,
   unknown, and trade-off states.
3. **Three-step method** — Brief → Evidence → Decision, with one concrete output per step.
4. **Trust and boundaries** — source state, privacy, illustrative supply, and advisor-consent rules
   in a compact ledger.
5. **Closing invitation** — repeat the same composer or focus the hero composer; do not introduce a
   new conversion path.

There will be no public property grid, testimonials, fabricated counters, named partner logos, ROI
promises, or generic journal feed.

### 2. Brief review — the first trust moment

The confirmation surface should feel like reviewing a concise architectural brief:

- original words;
- hard requirements;
- preferences;
- assumptions Rama made;
- questions Rama could not resolve;
- explicit confirmation before persistence/search.

Voice and text enter this identical state. The transcript remains editable and audio is never the
only representation.

### 3. Buyer Decision Room — the working product

Organize by decision need, not by content type:

1. brief/source rail;
2. lead match with both fit and mismatch reasons;
3. shortlist comparison of up to three candidates;
4. progressive evidence dossier;
5. Decision Ledger with changes and open questions;
6. advisor handoff only for eligible licensed records and explicit consent.

The room should use the same Nordic shell but increase information density. Evidence status is
shown through text, icon, and structure—not a rainbow of pills.

### 4. Saved decisions and account

Use a quiet chronological index, not a dashboard of vanity metrics:

- active decisions;
- last changed fact;
- unresolved question count;
- source-freshness state;
- export/delete controls;
- compare up to three compatible runs.

### 5. Staff continuity

Staff pages remain operational and data-dense. They share tokens and semantic states but do not
imitate the airy marketing composition. The primary object is the consented inquiry and its source
lineage, with organization scope and audit state visible.

## Hero specification — Nordic Decision Desk

### Desktop composition

Use a 12-column, maximum 1240px paper rail under a 64px solid header.

- Columns 1–7: wordmark context, short promise, supporting sentence, and the brief composer.
- Columns 8–12: a live **criteria specimen** that starts empty and demonstrates the output shape
  without fabricating a property.
- The approved architectural image becomes one restrained editorial crop below or behind the
  specimen edge, occupying no more than roughly one third of the first viewport. It is atmosphere,
  not inventory.
- The next-section cue remains visible at 1280×720.

Recommended copy hierarchy:

- Eyebrow: `Dubai buyer decision support`
- H1: `Make the right Dubai property decision.`
- Body: `Tell Rama what matters. Review the criteria, evidence, and unknowns before you compare.`
- Composer label: `Describe the decision you are making`
- Primary action: `Review my brief`
- Voice action: `Speak my brief`
- Boundary: `Current results are illustrative until licensed inventory is connected.`

The final exact public wording must be registered or derived from the existing approved claims.

### Criteria specimen

The right-hand specimen is the memorable product demonstration:

```text
YOUR BRIEF / DRAFT

Required        2 bedrooms · under AED 3M
Lifestyle       walkable waterfront
Preference      commute under 30 minutes
Unknown         service-charge tolerance

Rama will ask before assuming.
```

At idle it is a clearly labeled example, not a buyer-owned saved brief. During use it can preview
the buyer's reviewed criteria through existing typed state only.

### Mobile composition

- Promise first, composer second, criteria specimen third, optional image crop fourth.
- Voice is a labeled 44px control adjacent to the text action, never a floating orb.
- The composer and confirmation remain in document flow.
- No forced `100svh`; short screens must not clip state, transcript, or error recovery.

## Visual system

### Art direction

**Name:** Nordic Decision Desk  
**Character:** lucid, warm, civic, architectural, exact  
**Dubai expression:** limestone, shaded courtyards, water, pale sky, and measured brass detail  
**Avoid:** hotel-lobby luxury, black/gold prestige, glass panels, floating AI devices, abstract
orbs, excessive serif italics, and image-led claims of exclusivity

### Color roles

These are direction-level tokens; final values require rendered contrast checks.

| Role | Direction | Purpose |
| --- | --- | --- |
| Canvas | warm paper `#F5F3ED` | primary public surface |
| Raised | chalk `#FCFBF7` | inputs and evidence planes |
| Ink | blue-black `#172126` | text and primary action |
| Secondary text | slate `#556168` | supporting content |
| Rule | mineral `#D6D8D2` | hierarchy without card chrome |
| Fjord | muted blue `#4F7787` | focus, links, active evidence |
| Sky wash | pale blue `#DCE9EC` | calm contextual surface |
| Sand | ochre `#B58C54` | rare annotation or assumption accent |
| Success | pine `#3F6B5A` | sourced/available state |
| Warning | clay `#9A654D` | stale/unknown/action state |

### Typography

- Use Instrument Sans or an equivalently legible grotesk for nearly all interface and body copy.
- Retain Source Serif 4 only for one editorial sentence or selected section titles, not labels,
  instructions, or long italics.
- Add and verify a compatible Arabic face rather than relying on accidental fallback.
- Use sentence case by default. Uppercase is reserved for short evidence taxonomy labels.
- Use tabular numerals for AED, dates, areas, and comparison values.

### Geometry and spacing

- 4px base rhythm; principal spacing steps 8, 12, 16, 24, 32, 48, 72, 96.
- Controls: 6px radius; evidence planes: 0–8px; editorial media: 12px.
- One-pixel rules and surface changes do the work of most cards and shadows.
- 44px minimum touch targets and a clearly visible 2px focus treatment.
- Avoid repeated equal cards; use rows, definition lists, and aligned comparison planes.

### Motion

- Motion explains state transitions only: criteria added, source changed, panel expanded.
- No idle pulsing, infinite animation, parallax, or decorative reveal choreography.
- Active voice may animate the existing signal; reduced motion keeps a textual state and static
  icon.

## Component contract

All branded components should remain repository-owned shadcn-compatible registry sources:

- `DecisionDeskHero`
- `BriefComposer`
- `VoiceAction`
- `CriteriaSpecimen`
- `EvidenceState`
- `DecisionMethod`
- `BoundaryLedger`
- `DecisionRail`
- `MatchTradeoff`
- `ComparisonPlane`
- `DecisionLedgerTimeline`
- `ConsentHandoff`

Components accept typed evidence and state; they never derive property facts from prose or render
model-authored HTML.

## Content rules

1. Show product behavior instead of claiming intelligence or expertise.
2. Use `source`, `observed`, `assumption`, `unknown`, and `illustrative` as factual states.
3. Never use “verified,” “exclusive,” “off-market,” “best,” “trusted,” success metrics, reviews, or
   partner names without an approved claims-registry entry.
4. Never imply the architectural hero image is an available residence.
5. Keep English and Arabic copy structurally equivalent, including error, empty, and boundary
   states.
6. Market facts used in the interface need a source, observation date, expiry, and rights state.

## Superdesign execution brief

Continue project `38f08c91-f561-462b-bd06-bc0e992eaa98` after the authenticated Superdesign team has
access. Do not create a replacement project.

First canvas request:

1. Generate a replacement desktop landing-page direction using this document and the repository
   context files.
2. Generate the matching 390px mobile direction in the same design family.
3. Keep the landing route-first and do not add a public property grid.
4. Show hero, criteria specimen, method, boundary ledger, and closing invitation.
5. Use only evidence-safe copy and label all example criteria as examples.
6. Reuse existing behavior contracts; the canvas is a visual/IA proposal, not backend code.

After approval, create linked directions for the Brief Review and Buyer Decision Room before
changing production source. Saved decisions and staff continuity follow once the core buyer flow is
coherent.

## Delivery sequence

### Gate A — direction

- Restore access to the supplied Superdesign project.
- Generate desktop and mobile landing proposals.
- Review against this brief, product truth, EN/AR parity, and the attached baseline.
- Record the selected draft ID and update `.superdesign/resume.json`.

### Gate B — system foundation

- Reconcile `PRODUCT.md`, `.superdesign/design-system.md`, active design documentation, and tokens.
- Remove Vellaro/glass/AI-orb language from the active contract; retain historical documents as
  clearly labeled artifacts.
- Build or update registry primitives before page-local composition.

### Gate C — public vertical slice

- Implement header, Decision Desk hero, criteria specimen, method, boundary ledger, and footer.
- Preserve brief review, voice/text parity, source disclosure, route navigation, and rollback flags.
- Verify 320, 390, 768, 1024, 1280, and 1440px, EN/AR RTL, keyboard, screen-reader state, reduced
  motion, short landscape, and no horizontal overflow.

### Gate D — decision work surface

- Apply the same tokens and hierarchy to brief review and the Buyer Decision Room.
- Verify reload, direct navigation, Back/Forward, focus trap/return, stale/partial/empty states,
  evidence provenance, and illustrative-record handoff denial.

### Gate E — account and operations

- Redesign saved decisions/history and consented staff continuity without changing authorization
  boundaries.
- Run security, design, browser, and pre-handoff review.

Every implementation handoff runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in
addition to rendered QA.

## Acceptance criteria

The redesign is successful when:

- a new visitor can state what Rama does in one sentence without calling it a brokerage or portal;
- text and voice are equally obvious and lead to the same review state;
- the first viewport demonstrates criteria/unknowns rather than only showing property imagery;
- the page is visually calm without being empty or generic;
- every public claim is allowed by the claims registry;
- every factual decision item has a visible evidence state;
- English and Arabic preserve hierarchy and interaction parity;
- the landing remains an invitation and the Decision Room remains the only result/dossier surface;
- rendered QA passes the repository's required accessibility and responsive matrix.

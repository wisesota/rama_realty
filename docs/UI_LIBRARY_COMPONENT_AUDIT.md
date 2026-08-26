# Rama UI Library Component Audit

Date: 2026-08-25  
Scope: [ReUI](https://reui.io/docs), [Motion Primitives](https://motion-primitives.com/docs), [Magic UI](https://magicui.design/docs), and [Tailark](https://tailark.com/docs)  
Decision rule: adopt only when a component improves buyer comprehension, orientation, evidence inspection, recovery, or accessibility. Vendor code is reference material; Rama-owned registry sources remain authoritative.

## Decision key

- **Adopted**: already used in a governed Rama form.
- **Adapt**: implement a project-owned, tokenized pattern now.
- **Defer**: potentially useful on a later operational surface, but not the public landing.
- **Reject**: conflicts with Lagom restraint, product truth, accessibility, RTL, or bundle discipline.

## Frozen catalog accounting

This is a documentation prerequisite for the bounded implementation, not a runtime obligation to track vendor catalogs. Counts reflect the public documentation snapshot observed on 2026-08-25; inaccessible premium source is excluded and remains out of scope.

| Catalog surface | Observed | Dispositioned | Exclusions |
|---|---:|---:|---|
| ReUI named primitives/patterns | 23 | 23 | Premium blocks and source not publicly inspectable |
| ReUI example categories | 74 | 74 | Individual example variants inherit their category decision |
| Motion Primitives named components | 33 | 33 | None in the public component index |
| Magic UI named components | 76 | 76 | Premium templates are not part of the component index |
| Tailark named block/theme categories | 32 | 32 | Premium Quartz source and paid page variants |

## ReUI primitives

ReUI's strongest contribution is application information architecture. Its public catalog currently documents 22 primitives, plus a file-upload pattern and shadcn example categories. Rama does not add a second registry namespace because its own shadcn-compatible registry is already the source of truth.

| Component | Decision | Rama disposition |
|---|---|---|
| Alert | Adopted | Existing feedback and boundary planes already pair icon, label, and text. |
| Autocomplete | Defer | Useful only after licensed inventory creates a governed location vocabulary. |
| Badge | Adopted | Evidence State provides semantic source labels without pill-heavy decoration. |
| Cascader | Defer | Possible future area/community selector; premature for illustrative supply. |
| Code Block | Reject | No buyer-facing code surface. |
| Data Grid | Defer | Staff/provider operations only; not a public property grid. |
| Date Selector | Defer | Useful only for a governed handoff or viewing workflow. |
| Event Calendar | Reject | No scheduling contract exists. |
| Filters | Defer | Criteria review replaces portal-style filter chrome on the public route. |
| Frame | Adopted | Media Frame, Comparison Plane, and evidence planes already provide structured framing. |
| Gantt | Reject | No buyer task matches a Gantt model. |
| Icon Stack | Reject | Decorative isometric icon stacks conflict with the architectural visual language. |
| Icon Tile | Defer | May support compact staff empty states; not needed on the landing. |
| Kanban | Reject | No buyer workflow needs drag-and-drop columns. |
| Number Field | Defer | Future structured budget editing; native text remains more forgiving during discovery. |
| Phone Input | Defer | Only for an eligible, consented advisor handoff. |
| Rating | Reject | Ratings would fabricate credibility or encourage unsupported scoring. |
| Scrollspy | **Adapt** | Add quiet `aria-current="location"` state to existing long-page navigation. |
| Sortable | Reject | Criteria priority is governed, not a decorative drag interaction. |
| Stepper | Adopted | Process Rail and brief confirmation already express the governed sequence. |
| Timeline | Adopted | Decision Ledger Timeline is the Rama-specific chronological primitive. |
| Tree | Reject | No buyer-facing hierarchy benefits from a tree control. |
| File Upload pattern | Defer | Data-rights and staff surfaces may use it later; no public need exists. |

### ReUI example-category disposition

The 74 example categories were checked at the category level. **Defer vendor adoption** for Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Checkbox, Collapsible, Combobox, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Menubar, Native Select, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, and Tooltip: governed Rama/shadcn primitives remain preferred where already used, but this audit does not claim every equivalent is in production. Autocomplete, Calendar, Cascader, Chart, Data Grid, Date Selector, Event Calendar, File Upload, Filters, Frame, Gantt, Icon Stack, Icon Tile, Kanban, Number Field, Phone Input, Scrollspy, Sortable, Stepper, Timeline, and Tree inherit the explicit primitive decision above. Carousel and Rating are **Reject** on public buyer surfaces because Rama does not need testimonial, product-gallery, or score theater.

## Motion Primitives

Motion Primitives is used as an interaction reference, not installed through its CLI. The repository already depends on `motion`; project-owned wrappers keep reduced-motion, focus, lifecycle, and localization rules under Rama control.

| Component | Decision | Rama disposition |
|---|---|---|
| Accordion | Reject | Native `details/summary` keeps FAQ content semantic and no-JavaScript capable. |
| Animated Background | Reject | Competes with the residential hero and evidence hierarchy. |
| Animated Group | **Adapt** | Use a small opacity/translate state transition inside already-client voice surfaces. |
| Border Trail | Reject | Decorative attention loop. |
| Carousel | Reject | Hides content and adds navigation cost; Process Rail already has an accessible scroll-snap model. |
| Cursor | Reject | Custom cursors reduce predictability and touch parity. |
| Dialog | Adopted | Native `dialog` already provides the bounded voice surface; Motion may enhance its internal state only. |
| Disclosure | Reject | Native disclosure is simpler and avoids nested-button/hydration risks. |
| In View | Defer | GSAP already owns one-time landing entrances; duplicate observers would add bundle and behavior overlap. |
| Infinite Slider | Reject | Infinite movement conflicts with reduced-motion restraint and factual content. |
| Transition Panel | **Adapt** | Its calm state-continuity idea becomes a project-owned `StateTransition`, without animated height. |
| Text Effect | Reject | Character/word splitting risks Arabic shaping and distracts from factual copy. |
| Text Loop | Reject | Rotating promises weaken message stability. |
| Text Morph | Reject | Morphing localized text harms readability and may split Arabic shaping. |
| Text Roll | Reject | Decorative headline motion. |
| Text Scramble | Reject | Signals instability and reduces legibility. |
| Text Shimmer | Reject | Perpetual highlight conflicts with rare-accent governance. |
| Text Shimmer Wave | Reject | Same perpetual-motion conflict. |
| Animated Number | Defer | May suit real governed metrics later; current illustrative supply has no safe public metrics. |
| Sliding Number | Defer | Same governed-metric requirement. |
| Dock | Reject | Desktop metaphor, weak mobile parity, and unnecessary magnification. |
| Glow Effect | Reject | Glow/glass styling conflicts with the paper-and-ink system. |
| Image Comparison | Defer | Could compare verified plans or renovations later; current atmosphere imagery is not inventory. |
| Scroll Progress | Adopted | Rama uses a one-pixel CSS adaptation with no client runtime. |
| Spotlight | Reject | Pointer-led decoration lacks keyboard and touch equivalence. |
| Spinning Text | Reject | Decorative looping text. |
| Tilt | Reject | Perspective hover makes evidence planes feel like marketing cards. |
| Toolbar Dynamic | Defer | Possible dense staff workspace pattern only. |
| Toolbar Expandable | Defer | Possible Decision Room comparison actions only after real usability need. |
| Magnetic | Reject | Pointer attraction reduces motor predictability. |
| Morphing Dialog | Reject | Native dialog is clearer; open accessibility and hydration issues make this a poor trust-surface dependency. |
| Morphing Popover | Reject | No buyer task needs a morphing popover. |
| Progressive Blur | Adopted | Rama uses a restrained, low-blur overflow cue only inside the bounded dialog. |

## Magic UI

Magic UI is strongest as a source of small landing-page effects. Rama keeps only effects that communicate state or overflow. The rest would make the page look assembled from popular demos.

| Component | Decision | Rama disposition |
|---|---|---|
| Android | Reject | Device mockup is irrelevant. |
| Animated Beam | Reject | Decorative connection diagram. |
| Animated Circular Progress Bar | Defer | Only for a real governed completion metric. |
| Animated Gradient Text | Reject | Gradient display text conflicts with rare-accent and legibility rules. |
| Animated Grid Pattern | Reject | Adds visual noise behind evidence content. |
| Animated List | Defer | Could support staff event feeds; public notifications would be fabricated theater. |
| Animated Shiny Text | Reject | Perpetual shine. |
| Animated Theme Toggler | Reject | Dark mode is explicitly out of scope. |
| Aurora Text | Reject | Decorative gradient motion. |
| Avatar Circles | Reject | Would imply customers, agents, or partners without evidence. |
| Backlight | Reject | Glow treatment conflicts with paper-and-ink restraint. |
| Bento Grid | Reject | Generic AI-site signature; Rama uses editorial planes instead. |
| Blur Fade | Defer | Registry source is retained, but GSAP already owns public entrance choreography. |
| Border Beam | Reject | Perpetual border motion. |
| Code Comparison | Reject | No code-facing buyer task. |
| Comic Text | Reject | Wrong tone and typography. |
| Confetti | Reject | Undermines serious decision moments. |
| Cool Mode | Reject | Decorative pointer particles. |
| Dia Text Reveal | Reject | Character animation risks Arabic shaping. |
| Dock | Reject | Desktop novelty with poor touch value. |
| Dot Pattern | Reject | Unnecessary background texture. |
| Dotted Map | Defer | A governed commute/location evidence map may use a static concept later. |
| File Tree | Reject | No buyer use. |
| Flickering Grid | Reject | Flicker and density conflict with accessibility and Lagom. |
| Glare Hover | Reject | Pointer-only sheen. |
| Globe | Reject | Cross-border decoration does not answer a buyer criterion. |
| Glyph Matrix | Reject | Tech-demo visual language. |
| Grid Pattern | Reject | Current one-pixel architectural rules already structure space. |
| Hero Video Dialog | Reject | The hero action must open Rama's voice/text brief, not promotional video. |
| Hexagon Pattern | Reject | Decorative geometry outside the design system. |
| Text Highlighter | Defer | Could annotate governed unknowns later, but evidence labels already do this more clearly. |
| Hyper Text | Reject | Scramble-like heading motion. |
| Icon Cloud | Reject | Implies integrations or partners and adds decorative motion. |
| Interactive Grid Pattern | Reject | Pointer-led background effect. |
| Interactive Hover Button | Reject | Hover choreography adds little to the primary brief action. |
| iPhone | Reject | Device mockup is irrelevant. |
| Kinetic Text | Reject | Display spectacle conflicts with stable copy. |
| Lens | Reject | Zooming illustrative scenes could imply inspectable inventory. |
| Light Rays | Reject | Atmospheric effect competes with the real cityscape. |
| Line Shadow Text | Reject | Moving text treatment. |
| Magic Card | Reject | Spotlight/glow card styling conflicts with evidence planes. |
| Marquee | Reject | Infinite motion and repeated content. |
| Meteors | Reject | Decorative particles. |
| Morphing Text | Reject | Message instability and Arabic risk. |
| Neon Gradient Card | Reject | Wrong material and palette. |
| Noise Texture | Reject | The photography already provides material texture. |
| Number Ticker | Defer | Requires governed, sourced metrics. |
| Orbiting Circles | Reject | Generic AI-orb language explicitly prohibited. |
| Particles | Reject | Decorative GPU work. |
| Pixel Image | Reject | Wrong image treatment for architecture. |
| Pointer | Reject | Custom cursor reduces predictability. |
| Progressive Blur | **Adopted** | Low-blur dialog overflow cue with a semantic trigger condition. |
| Pulsating Button | Reject | Perpetual CTA pressure conflicts with calm decision support. |
| Rainbow Button | Reject | Off-brand and inaccessible over varied imagery. |
| Retro Grid | Reject | Tech-demo background. |
| Ripple Button | Reject | Material-style ripple is outside Rama's interaction language. |
| Ripple | Reject | Generic AI-orb/background motion. |
| Safari | Reject | Browser mockup is irrelevant. |
| Scroll Based Velocity | Reject | Moving copy while scrolling harms reading. |
| Scroll Progress | **Adopted** | One-pixel, direction-aware CSS progress line. |
| Shimmer Button | Reject | Perpetual button decoration. |
| Shine Border | Reject | Perpetual border decoration. |
| Shiny Button | Reject | Perpetual highlight. |
| Smooth Cursor | Reject | Custom cursor and continuous animation. |
| Sparkles Text | Reject | Wrong tone. |
| Spinning Text | Reject | Looping display text. |
| Striped Pattern | Reject | Unnecessary background texture. |
| Terminal | Reject | No technical buyer narrative. |
| Text 3D Flip | Reject | Character motion and Arabic risk. |
| Text Animate | Reject | GSAP already performs bounded whole-block reveal without character splitting. |
| Text Reveal | Reject | Scroll-masked long copy reduces immediate comprehension. |
| Tweet Card | Reject | Would import unverifiable social proof. |
| Typing Animation | Reject | Fake typing is a familiar AI-site trope and delays comprehension. |
| Video Text | Reject | Masked video text is illegible and decorative. |
| Warp Background | Reject | Tech-demo aesthetic. |
| Word Rotate | Reject | Rotating value propositions weaken message clarity. |

## Tailark

Tailark is evaluated at its named block-category level across Dusk, Mist, Veil, and Quartz. Repeating a category in multiple themes does not create a new Rama use case; each category receives one product decision.

| Block/category | Decision | Rama disposition |
|---|---|---|
| Dusk theme | Reject | Zinc/default shadcn styling conflicts with Rama tokens. |
| Mist theme | Reject | Indigo SaaS styling conflicts with Fjord/paper roles. |
| Veil theme | Reject | Warm neutrals are adjacent, but importing its theme would create duplicate tokens. |
| Quartz theme | Reject | Premium theme, dark-mode assumptions, and licensing are unnecessary. |
| Header | Adopted | Transparent-to-solid Rama navigation is more product-specific. |
| Hero section | Adopted | Centered Residential Horizon hero already implements the useful composition without announcement pills or product-console chrome. |
| Secondary hero | Reject | The landing needs one promise and one entry point. |
| Content | Adopted | Alternating editorial paper surfaces and asymmetric media already follow the useful pattern. |
| Features | Adopted | Rama capabilities are expressed as inspectable decision states, not generic cards. |
| Features carousel | Reject | Hides content and adds control cost. |
| Expandable features | Defer | Could support dense Decision Room explanations if user testing shows a need. |
| Bento | Reject | Recognizable template/AI-site composition. |
| How it works | Adopted | Process Rail expresses the governed buyer method. |
| Comparator | Adopted | Comparison Plane is a truth-aware, Rama-specific adaptation. |
| Description list | Adopted | Boundary Ledger uses label/value semantics and one-pixel rules. |
| FAQs | Adopted | Native details keep answers semantic, printable, and no-JavaScript capable. |
| Call to action | Adopted | Return to Brief reuses the single original composer instead of creating a lead funnel. |
| Footer | Adopted | Product-state footer exposes boundaries, privacy, and staff login. |
| Blog blocks | Defer | Evergreen buyer briefings exist; sourced market publishing remains governed future work. |
| Code demo | Reject | No buyer-facing use. |
| Contact | Reject | Would create a second lead funnel outside consented handoff. |
| Integrations | Reject | Logo grids would imply unapproved partnerships. |
| Investors | Reject | Unsupported credibility surface. |
| Logo cloud | Reject | Unsupported partner/customer implication. |
| Open roles | Defer | Corporate hiring surface is unrelated to this release. |
| Pricing | Reject | Rama has no approved public pricing contract. |
| Stats | Reject | No governed public metrics are approved. |
| Team | Reject | Not needed for the buyer decision journey. |
| Testimonials | Reject | Unsupported social proof is explicitly prohibited. |
| Login / sign-up / forgot-password | Defer | Native Supabase auth already owns these operational routes; no Tailark theme import. |
| Complete pages | Reject | Full-page kits would overwrite Rama's route and product architecture. |
| Illustrations | Reject | Original rights-registered Dubai architectural media is the approved visual basis. |

## Implemented selection

1. **ReUI Scrollspy concept** becomes scroll-aware `aria-current="location"` on the existing navigation, with a quiet one-pixel marker.
2. **Motion Primitives Animated Group / Transition Panel concept** becomes a Rama `StateTransition` that only crossfades semantic state content; it never animates height or individual characters.
3. **Magic UI Progressive Blur** remains a conditional dialog overflow cue, not a decorative image effect.
4. **Magic UI Scroll Progress** remains a one-pixel CSS enhancement with no client dependency.
5. **Tailark comparator, description-list, FAQ, content, CTA, and footer composition** remain translated into Rama's existing Comparison Plane, Boundary Ledger, native FAQ, editorial sections, Return to Brief, and product-state footer.

## Rejection principle

The catalog contains many good components. Most are still wrong for Rama. “Award-level” craft here comes from product-specific hierarchy, truth, bilingual execution, performance, and subtraction—not from maximizing the number of visible effects.

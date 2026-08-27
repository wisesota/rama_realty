# Rama Realty: Jumping the Curve

**Status:** APPROVED by CTO; Option A selected; Phase 0 authorized  
**Prepared:** 22 August 2026  
**Approved:** 22 August 2026  
**Decision owner:** CTO, under delegated product authority  
**Repository:** `C:\rama-agent`

## Executive verdict

Rama should not try to win by becoming another luxury inventory gallery with a microphone attached. Natural-language property search is already present in the portal market, developer sites remain strong catalog destinations, and Dubai's record transaction growth is arriving alongside a large, off-plan-heavy supply pipeline. The valuable unsolved job is not “show me beautiful property.” It is “help me turn an ambiguous cross-border brief into a defensible decision without losing the evidence.”

The recommended product is a **governed, voice-first Dubai Buyer Decision OS**:

- Voice is the fastest invitation, not the only doorway.
- Text, keyboard, transcript, and editing have equal product status.
- The landing page captures intent and trust; it does not become a second results application.
- Every successful brief routes to the locale-aware Decision Room, canonically `/{locale}/discover/{searchRunId}` after the planned locale migration.
- The Buyer Decision Room owns matches, evidence, scenarios, comparison, provenance, and consent-aware advisor handoff.
- Illustrative records remain unmistakably illustrative until a licensed provider is connected.
- AI interprets and narrates; typed application contracts retrieve, calculate, persist, and render facts.
- Architectural imagery expresses Rama's editorial point of view. It never silently narrows the real market or implies available inventory.

This is a pivot in emphasis, not a backend rewrite. It preserves the repository's strongest product and engineering decisions while replacing the proposed “voice-only gallery” premise.

## The product-identity decision

**Decision: select Option A.** The product identity is now settled. Phase 0 may begin immediately; later phases remain gated by the evidence and safety checks in this plan. Production connector activation, deployment, and use of exposed credentials remain unauthorized.

| Option | Product | Upside | Cost and risk | CTO verdict |
| --- | --- | --- | --- | --- |
| **A. Governed voice-first Decision OS** | Voice-led brief, equal text path, route-first Decision Room, evidence and provenance | Distinctive and accessible; compounds existing architecture; creates a trust moat | Requires disciplined evidence contracts and licensed-supply work | **SELECTED** |
| B. Radical voice-only gallery | Microphone above the fold; results and dossiers on the landing page | Visually dramatic demo | Excludes or degrades many users; duplicates the Decision Room; makes AI and imagery the product; weakens route/history/recovery; conflicts with repository contract | Reject |
| C. Conventional luxury portal | Search filters and property cards dominate | Familiar and faster to explain | Competes on inventory scale, SEO, and paid acquisition against incumbents; abandons the reason Rama exists | Reject |

### CTO rationale

The decision is based on five facts:

1. Bayut already offers natural-language AI search and an AI-backed valuation product. Voice or chat alone is not defensible differentiation.
2. Knight Frank recorded 72% of Q1 2026 residential transactions as off-plan while citywide price growth slowed and the market entered late-cycle conditions.
3. Knight Frank projects roughly 350,000 residential units by 2030, but historical delivery materialization was about 60% from 2021–2025. Buyers need delivery and freshness reasoning, not a larger gallery.
4. Prime and ultra-luxury demand remains strong, including 296 transactions above US$10 million in H1 2026, but that does not validate an exclusive luxury-villa catalog or fabricated advisory authority.
5. The repository already owns the harder product primitives: one canonical discovery envelope, a durable Decision Room route, provenance rules, voice/text parity, buyer-session controls, and illustrative-record handoff denial.

Therefore Rama will compete on **decision assurance across fragmented supply**. Voice is the fast front door. The retained evidence and Decision Ledger are the product.

## What the repository already proves

The current codebase is not a blank-slate marketing site. It already contains the difficult spine of the recommended product:

- `README.md`, `AGENTS.md`, and `docs/CTO_ARCHITECTURE.md` define voice-led Dubai property discovery, explainable criteria, and illustrative supply until a licensed source exists.
- Text and recorded/live voice entry points converge on a shared discovery envelope.
- Supabase is canonical for the search run, buyer session, source status, shortlist, and inquiry path.
- `/discover/[searchRunId]` gives the decision experience a durable URL, direct navigation, Back/Forward behavior, and a full-page recovery path.
- Gemini credentials remain server-side; the Live route mints a short-lived, one-use constrained token.
- Inquiry creation is same-origin, consent-gated, validated, idempotent, rate-limited, and owner-scoped.
- Browser analytics starts opted out and asks for an explicit consent choice.
- The repository already has tests for text/voice envelope parity and provenance invariants.

The redesign should therefore be a controlled presentation and decision-quality evolution, not an alternate application layered onto the landing page.

### Current contradictions to quarantine, not polish

The working tree also contains newer, mostly untracked presentation work that conflicts with that spine:

- `components/landing-page.tsx` imports the Archivanta marketing sections, uses rounded/pill and heavy-shadow hero chrome, and publishes the blanket claim “Dubai Land Department (DLD) ESCROW Compliant.”
- `components/voice-signal.tsx` loads the newer `/lottie/voice.ai.json` instead of the contract-owned `/lottie/ai.json`; `active={active || true}` also forces the animation active while idle.
- `components/archivanta/archivanta-about.tsx` contains unsupported portfolio volume, 100% escrow, bank-guarantee, allocation, developer-relationship, masterplan, yield, and markup claims.
- `components/archivanta/archivanta-reviews.tsx` contains unverified customer quotations, satisfaction figures, and “Verified Advisory Audits.”
- The untracked `PRODUCT.md` contradicts itself by requiring representative illustrations while also claiming verified reviews and success metrics.
- `.env.example` exposes a recorded-voice model override while product documentation describes the Live model as pinned; variable roles and environments are not classified.
- `scripts/verify-supabase.mjs` can reuse `GEMINI_API_KEY` as the fallback rate-limit secret even though production documentation requires independent secrets.

These files are evidence about the design exploration, not proof of operating history. The redesign must remove or substantiate the claims and reconcile the asset/state contracts before any of this work is considered production UI.

## Market thesis: growth increases the need for judgment

### Current market signal

- Dubai Land Department reported more than 270,000 real-estate transactions worth more than AED 917 billion in 2025. Investment value reached AED 680 billion, and 129,600 investors entered the market for the first time. This is the whole real-estate market, not a residential-only number. [DLD 2025 milestone](https://www.protocol.dubai.ae/en/media-listing/news-events/dubai-s-real-estate-market-records-new-historic-milestone-with-transactions-exceeding-aed917-billion-in-2025/)
- Q1 2026 real-estate transaction value reached AED 252 billion, up 31% year over year, while foreign investment reached AED 148.35 billion. [DLD Q1 2026](https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026)
- Dubai recorded 1.38 million tenancy contracts worth AED 126.4 billion in 2025, alongside 937 projects under construction. [DLD rental-sector report](https://dubailand.gov.ae/en/news-media/dubai-s-rental-sector-records-strong-growth-in-2025-underscoring-market-stability-and-the-strength-of-the-emirate-s-real-estate-ecosystem)
- CBRE counted more than 206,000 residential transactions in 2025, up 18%, with off-plan sales representing nearly three-quarters of activity. Prices were up 13% year over year, but results varied materially by community. [CBRE UAE Q4 2025](https://www.cbre.ae/press-releases/uae-real-estate-market-review-q4-2025)
- Knight Frank describes a two-speed market: prime locations are outperforming as mainstream growth normalizes. It forecasts about 3% prime and 1% mainstream price growth during 2026. [Knight Frank Q4 2025](https://www.knightfrank.ae/newsroom/article/2026/2/dubai-residential-market-review-q4-2025)
- CBRE's Q1 2026 review counted more than 45,000 Dubai residential transactions worth AED 137 billion, but reported moderating price/rental growth, off-plan dominance, softer March activity, and more cautious investors. [CBRE Q1 2026](https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q1-2026)
- Knight Frank's Q1 2026 report counted 45,158 transactions worth AED 137.3 billion; 72% were off-plan. It expects about 95,649 units to complete on time during 2026 rather than 144,888 previously forecast, and estimates roughly 350,000 residential completions by 2030 would require sustained population growth near 5% to preserve equilibrium. [Knight Frank Q1 2026](https://www.knightfrank.ae/site-assets/pdf/2026/dubai-residential-market-review-q1-2026.pdf)
- The ultra-luxury segment remains active: Knight Frank reported 296 sales above US$10 million in H1 2026. This supports a premium buyer wedge, not unsupported exclusivity or market-wide certainty. [Knight Frank H1 2026](https://www.knightfrank.ae/newsroom/article/2026/7/dubai-us%24-10m-residential-sales-analysis-q2-2026)

### Supply and delivery risk

The bullish headline is incomplete without the supply side:

- Knight Frank tracked more than 160,000 units registered for potential 2026 delivery; 85% of the forecast pipeline is apartments and 14% villas.
- Only 64% of scheduled homes were completed on time in 2025, representing 39,700 delivered units versus a roughly 36,000-unit long-run annual rate.
- A registered pipeline is not the same thing as delivered, available, or suitable supply. Buyers need the system to explain this distinction rather than convert it into a false forecast.

Product implication: the primary decision objects should include source date, launch/delivery status, availability status, developer or source identity, evidence confidence, and scenario sensitivity. A matching percentage without those fields is insufficient.

### Regulation makes provenance a product requirement

- DLD says its AI-enabled advertising governance monitored 279,000 real-estate advertisements and caused 29% to be modified. [DLD advertising governance](https://dubailand.gov.ae/en/news-media/dubai-land-department-strengthens-transparency-with-ai-enabled-real-estate-advertising-governance)
- Madmoun provides a QR mechanism for checking real-estate ad permits, and DLD maintains a licensed-broker lookup. [Madmoun](https://dubailand.gov.ae/en/news-media/dubai-land-department-provides-madmoun-service-to-verify-validity-of-real-estate-ads-via-qr-codes) · [licensed brokers](https://dubailand.gov.ae/en/eservices/licensed-real-estate-brokers/?r=1)
- DLD has fined brokers and issued legal warnings for advertising non-compliance. [DLD enforcement](https://dubailand.gov.ae/en/news-media/dubai-land-department-fines-256-brokers-for-failing-to-comply-with-advertising-terms-and-conditions-over-the-past-six-months)

Product implication: “verified” must be a typed, source-specific state with a timestamp and evidence pointer. It must never be decorative marketing language.

## Competitive position

### What buyers can already get

| Category | Current pattern | Evidence | Rama should not imitate |
| --- | --- | --- | --- |
| Developer destinations | Emaar and Meraas emphasize location, type, bedroom, price, availability, list/map, and project storytelling | [Emaar search](https://www.emaar.com/en/property-search) · [Meraas projects](https://meraas.com/en/project-listing) | A smaller catalog with prettier filters |
| Horizontal portal | Bayut already presents natural-language “Ask AI,” and BayutGPT markets property and market Q&A | [Bayut](https://www.bayut.com/en/) · [BayutGPT](https://www.bayut.com/mybayut/bayutgpt-ai/) | Claiming conversational search itself is a moat |
| Valuation utility | Property Finder markets an AI-supported home-valuation feature | [Property Finder valuation](https://www.propertyfinder.ae/blog/how-property-finder-home-valuation-feature-works/) | An unsupported instant valuation claim |
| Consumer trust need | Property Finder's buyer research highlights accuracy, validity, condition, DLD authentication, and reviews | [Open Doors white paper](https://www.propertyfinder.ae/blog/wp-content/uploads/2024/06/Property-Finder-Open-Doors-White-Paper-2024-Online-1.pdf) | Treating emotion and cinematic imagery as enough |

### The wedge

Rama sits between broad inventory portals/developer destinations and a licensed human advisor:

```text
Portal or developer facts
          |
          v
Governed ingestion and provenance
          |
          v
Buyer brief --> criteria ledger --> explainable shortlist --> scenario/risk review
                                                               |
                                                               v
                                              consented licensed handoff
```

The moat is a retained **Decision Ledger**: what the buyer said, what the system inferred, which evidence supported each candidate, what changed, what remains unknown, and why a human handoff is now warranted.

## Target customer and job to be done

### Primary ICP

A serious cross-border or newly resident Dubai buyer who:

- is evaluating a purchase rather than casually browsing;
- has a multi-variable brief that standard filters cannot express;
- needs clarity across lifestyle, capital exposure, delivery risk, and source status;
- distrusts pressure-led broker funnels;
- is comfortable starting with voice but requires a written record before acting.

The first wedge is not “all luxury buyers.” It is a time-constrained buyer making a consequential, evidence-sensitive decision without deep local market context.

This ICP remains a strategic hypothesis. Before expanding the interface, validate:

- investor-led versus owner-occupier-led entry;
- initial budget band and property segment;
- English/Arabic priority and code-switching behavior;
- who pays: buyer subscription/advisory fee, licensed partner, or qualified introduction;
- whether the repeated value is monitoring and decision continuity or a single transaction;
- a credible distribution lane that does not depend on broad paid acquisition.

### Job statement

> When I am trying to decide whether and where to buy in Dubai, help me turn my priorities and uncertainties into a transparent, editable decision record, so I can compare credible options and engage a licensed person only when the evidence is ready.

### Anti-personas for the first release

- high-volume listing browsers who optimize for inventory breadth;
- sellers seeking a public automated valuation;
- brokers seeking an autonomous lead-generation bot;
- buyers expecting legal, tax, mortgage, or guaranteed-return advice;
- users who require live availability before a licensed source is connected.

## Experience strategy

### Landing: the invitation

The landing page has three jobs only:

1. explain Rama in one evidence-safe sentence;
2. accept a spoken or typed brief;
3. explain how sources, privacy, and illustrative status work.

Recommended above-the-fold hierarchy:

1. Rama wordmark and minimal navigation.
2. One-line desktop editorial heading using Source Serif 4.
3. A plain-language promise: “Tell Rama what would make a Dubai home the right decision.”
4. The project-owned `public/lottie/ai.json` as the address/listening signal.
5. One compact microphone control and an equally available text entry.
6. Live status in text: ready, connecting, listening, thinking, speaking, or unavailable.
7. A source-truth line: “Illustrative residences until licensed inventory is connected.”

No results grid, dossier, fake portfolio count, fabricated testimonial, market superlative, or advisor CTA belongs above the fold.

Freeze the intended composition before implementation: an airy editorial rail no wider than roughly 1200px, the approved daylight hero asset, the serif heading, voice signal, visible text field, status, and source disclosure. At 1280×720 these elements must all fit without scrolling. The current dark full-screen overlay, bold sans heading, pulsing status ornament, pill search/chips, heavy shadows, and long Archivanta marketing tail are not the baseline to refine.

### Interaction contract

Voice and text produce the same versioned brief and envelope:

```text
spoken or typed brief
        |
        v
transcript / normalized criteria
        |
        v
buyer confirms or edits meaning
        |
        v
governed discovery service
        |
        v
persisted search run
        |
        v
/{locale}/discover/{searchRunId}
```

The system never treats a transcript as consent and never treats model output as property truth.

Voice must finish in an inline confirmation surface containing the transcript, inferred criteria, edit, retry, and confirm actions. Do not navigate or persist the search run until the buyer confirms meaning. Text input stays visible in the first viewport at every supported width.

This requires an explicit state machine because the current text, recorded, and Live paths call the persisting discovery service directly:

```text
capture -> transcript -> normalize -> review/edit
                                  | cancel -> discard
                                  v confirm
                       idempotent discovery POST
                                  v
                         persisted search run
                                  v
                     /{locale}/discover/{id}
```

Replace the pre-confirmation Live `search_properties` behavior with a non-persisting, non-side-effecting `prepare_brief` operation. Draft transcript and criteria remain component-owned until confirmation. Confirmation carries a client request/idempotency key; double-confirm, reconnect, retry, or a late/stale tool result must create at most one run and navigate at most once.

### Buyer Decision Room: the work surface

The route-backed room should organize information by decision need, not content type. It is a progressive work surface, not eight equal tabs or one endless dossier:

1. **Brief/source rail** — original words, normalized criteria, assumptions, unresolved questions, and source state.
2. **Lead match** — the strongest current candidate with both match and mismatch reasons.
3. **Shortlist/compare** — differences and trade-offs for up to three candidates, not a wall of checkmarks.
4. **Progressive dossier** — evidence, delivery, and deterministic scenarios revealed as needed.
5. **Decision Ledger** — revisions, dismissed candidates, new constraints, and open questions.
6. **Advisor handoff** — shown only when the supply and consent boundary permits it.

On mobile, use the full-page route instead of a rounded bottom sheet. Preserve content order, context, and direct navigation rather than simulating a temporary modal application.

Every AI-written statement is either:

- a paraphrase of the buyer's own input;
- a bounded inference labeled as such;
- a summary tied to retrieved evidence; or
- a clarification question.

### Visual direction

Use the approved Editorial Property Atelier, interpreted through restrained Nordic Lagom:

- airy gallery canvas;
- Source Serif 4 and Instrument Sans;
- ink, sky-blue, and sand semantic tokens;
- square overall geometry with 16px editorial media corners;
- 6–8px compact controls and generous whitespace;
- calm daylight, tactile stone, desert materiality, and human-scale waterfront architecture;
- project-owned hero and Lottie assets;
- no glass effects, generic orbs, ornamental curves, pill-heavy SaaS chrome, or shiny “AI” gradients.

The proposed Brutalist Desert Villa and Organic Minimalist Waterfront Pavilion can be used as **two editorial visual theses**. They must not be described as the exclusive inventory model, and any depicted record must carry its real provenance state.

Generated design references are subordinate to the product contract. `AGENTS.md`, the reviewed DTCG/semantic tokens, repository registry primitives, and approved route-first documents outrank generated files such as `design-system/rama-realty/MASTER.md` when they conflict. Generated Archivanta sections are removed from the public composition unless every claim and interaction passes the same contract.

Every public image needs source/rights metadata, intended use, crop/focal guidance, and truthful localized alt text. The untracked Brutalist/Nordic imagery may be conceptual mood imagery only after rights review and an explicit conceptual label; it must not be attached to a candidate record or a Dubai place name. `public/images/rama-hero-editorial-daylight.png` and `public/lottie/ai.json` remain the approved hero assets.

### Bilingual and accessible by construction

- English and Arabic are first-class content contracts, not a translation pass at the end. Use locale-prefixed canonical routes such as `/en/discover/{searchRunId}` and `/ar/discover/{searchRunId}`, persist locale with the search run, and server-render the correct `lang` and `dir`. Legacy unprefixed routes redirect to the stored or default locale.
- Add an Arabic typeface with verified glyph coverage and visual compatibility; do not silently fall back from the Latin-only family.
- Logical CSS properties and semantic DOM order must support RTL without mirroring media meaning or numerical values incorrectly.
- Apply bidirectional isolation to AED values, numbers, dates, URLs, and mixed Arabic/English community names; document which directional icons flip.
- Voice controls require visible labels, live-region status, keyboard activation, and a non-audio outcome.
- A transcript must remain visible and editable before submission.
- Focus must move predictably to errors, the opened Decision Room, and the invoking control on close.
- Reduced-motion mode disables nonessential visualizer animation; meaning remains in text.
- The final experience must work at 320, 390, 768, 1024, 1280, and 1440 pixels without horizontal overflow.
- The one-line desktop hero rule applies only where it fits without clipping; Arabic and narrow viewports may wrap intentionally.
- Move the direct and intercepted Decision Room routes under the locale segment. Soft versus hard navigation may choose presentation, but viewport size must not choose a different data route or renderer; the intercepted presentation becomes full-viewport on mobile.

These requirements align with W3C guidance on equivalent text, labeled forms, and keyboard accessibility. [WAI accessibility principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/) · [keyboard accessible](https://www.w3.org/WAI/WCAG22/Understanding/keyboard-accessible.html)

### Interaction and recovery matrix

Before implementation, attach user-visible copy, primary recovery action, focus target, and retained-data behavior to every state:

| Surface | Required states |
| --- | --- |
| Landing | idle, invalid brief, submitting, persistence failure, offline |
| Voice | permission request, denial, connecting, listening, partial transcript, thinking, speaking, no speech, timeout, session expiry, recorded fallback, unsupported device |
| Discovery | zero results, partial results, stale results, source unavailable, retryable/non-retryable persistence failure |
| Decision Room | loading, missing/expired run, image failure, evidence loading/error, stale/unknown evidence, compare with 0/1/2/3 selections, ambiguous inquiry delivery |

Use one atomic live region for phase changes; do not repeatedly announce interim transcript fragments. Unknown and illustrative states use neutral visual language, never a shield, checkmark, or positive “verified” color. Reserve verification styling for a precisely checked assertion with its source and observation time.

## Voice and AI architecture

### Principle: perceived immediacy without invented latency

There is no evidence for a universal sub-250ms end-to-end response promise. Gemini Live is a preview API; network, VAD, model generation, tool calls, and audio playback are separate latency layers. The product should acknowledge input locally and immediately, then measure each remote stage rather than advertise an unsupported number.

Recommended latency telemetry:

- press-to-listening visual acknowledgment;
- press-to-session-ready;
- end-of-speech to first transcript update;
- end-of-speech to first agent audio;
- tool-call start to tool-result ready;
- brief-submit to Decision Room usable;
- fallback activation and recovery time.

Targets should be set only after a representative mobile/desktop baseline. Publish P50 and P95, segmented by input mode, language, connection class, and fallback path.

### Runtime topology

```text
Browser component-owned media/audio state
       |                     \
       | short-lived token    \ recorded fallback
       v                       v
Gemini Live WSS          same-origin /api/voice/turn
       |                       |
       +----------+------------+
                  v
          typed tool boundary
                  |
                  v
       canonical discovery service
                  |
                  v
               Supabase
                  |
                  v
        deterministic React renderer
```

The current token route already follows the correct security shape: a server-held API key mints a one-use, short-lived token and pins model/configuration. Google recommends ephemeral tokens for client-to-server Live connections. [Gemini Live](https://ai.google.dev/gemini-api/docs/live-api) · [ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens)

### Session behavior

- Component-owned microphone streams, audio contexts, timers, abort controllers, sockets, and focus-return elements are disposed on every exit path.
- Interruption stops queued audio immediately and clears the client playback buffer.
- A reconnect never silently resubmits an inquiry or replays a tool side effect.
- Context compression and session resumption are optimizations, not truth stores.
- The browser displays an explicit fallback when Live is disabled, token minting fails, a session expires, or native audio cannot start.
- Arabic and English must be tested with code-switching, named Dubai communities, currency, bedroom counts, and dates.

Gemini's native-audio Live capability supports Arabic, but documented limits and preview status require fallbacks and monitoring. [Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities) · [best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices)

### Tool boundary

The model may request only typed, allowlisted operations such as:

- normalize a brief;
- ask one clarification;
- retrieve candidate facts;
- retrieve a source record;
- create a deterministic payment or sensitivity scenario;
- persist a confirmed criterion change;
- prepare, but not submit, an advisor-handoff summary.

Authorization, ownership, validation, rate limits, data fetching, calculations, and side effects remain server decisions. The model never writes HTML, SQL, arbitrary URLs, or final claims directly to the client.

## Data and evidence contracts

### Keep canonical application truth in Supabase

Zustand remains bounded presentation state. The canonical objects should remain or become:

- `buyer_session` — anonymous/authenticated binding and rotation state;
- `search_run` — original input, normalized brief, version, locale, status;
- `criterion` — value, source (`buyer`, `model_inference`, `advisor`), confidence, confirmation state;
- `candidate` — source entity reference and eligibility state;
- `assertion` — a single claim about a candidate;
- `evidence` — source, observed time, retrieval method, freshness, and excerpt/hash where lawful;
- `scenario` — deterministic inputs, outputs, units, disclaimer, calculator version;
- `decision_event` — shortlist, dismiss, compare, criterion edit, evidence view;
- `handoff` — explicit consent, eligible licensed record, idempotency key, delivery state.

The Decision Ledger must preserve both **what the buyer saw** and **what is currently canonical**. A defensible event cannot later resolve only against a changed catalog record. Store an immutable as-seen snapshot or assertion set, source observation time, envelope/schema/parser version, and content hash. At read time, compare the snapshot with current canonical assertions and render the differences. Define behavior when publication rights expire, a source record disappears, or a corrected fact invalidates a prior scenario.

### Evidence-state vocabulary

Use a small finite set; do not collapse them into “verified”:

| State | Meaning | UI consequence |
| --- | --- | --- |
| `illustrative` | Project-owned demo record; not a live listing | Persistent label; no advisor handoff |
| `source_observed` | Fact was retrieved from an identified source at a recorded time | Show source and freshness |
| `licensed_feed` | Record came from a contractually licensed feed | Show provider and terms-compliant attribution |
| `permit_checked` | An advertisement permit or equivalent record was checked | Show check time and identifier only as allowed |
| `advisor_confirmed` | A licensed human confirmed a bounded statement | Show person/organization role and time |
| `stale` | Source is outside its freshness rule | Exclude or visibly warn |
| `unknown` | Evidence is absent or ambiguous | Do not infer a positive claim |

Availability, title, ownership, project registration, ad permit, delivery date, price, and advisor license are separate assertions and may have different states.

### Claims registry

Public and advisor-facing claims need a registry separate from prose components. Each entry should record:

- exact claim and permitted variants;
- claim type and geography;
- canonical source and observation date;
- owner and reviewer;
- legal/compliance review state when required;
- expiry or freshness rule;
- permitted surfaces and audiences;
- required disclaimer or attribution;
- current status: approved, restricted, expired, or rejected.

A CI/content check should reject known prohibited patterns and expired claim identifiers. This is not a substitute for human legal review; it makes the review state explicit and testable.

### Ingestion rule

PostgreSQL/Supabase remains canonical. Search indexes, caches, AI context, and MCP results are rebuildable projections. Any future crawler or licensed feed must land in a quarantine/staging boundary before normalization, provenance validation, and publication. External page content is untrusted input and can contain prompt-injection instructions.

### Evidence migration and compatibility

Move from the current property-level v1 provenance to assertion-level evidence through expand-and-cutover steps:

```text
additive tables/columns + RLS
        -> generated database types
        -> versioned v2 writer/RPC
        -> v1/v2 compatible reader
        -> shadow validation against v1
        -> feature-flagged renderer
        -> cutover
        -> later cleanup after retention window
```

Each migration design names ownership keys, uniqueness/idempotency constraints, foreign-key deletion behavior, indexes, backfill behavior, source-rights expiry behavior, and RPC versioning. Rollback disables the new writer/renderer and returns to the compatible reader; it never depends on reversing a destructive data migration.

## MCP and connector strategy

MCPs are development/operator capabilities, not a shortcut around product APIs, user consent, RLS, or the canonical data model.

| Connector | Approved purpose | Default mode | Hard boundary |
| --- | --- | --- | --- |
| Supabase | Inspect dev/test schema, migrations, logs, policies, and query plans | Project-scoped, read-only, OAuth | Never connect an agent to production; no service-role credential in MCP config |
| GitHub | Read issues, diffs, Actions, and repository metadata | Official remote server, OAuth, read-only toolsets | No write/merge/release tools until remote and branch policy are intentionally reviewed |
| Firecrawl | Time-bounded market/source research and ingestion prototypes | Search/read only; domain and URL allowlists | Crawled text is untrusted; no direct publication or model-instruction authority |
| Sentry | Inspect bounded errors and performance evidence | Official remote, `inspect`/read-only, org/project constrained | No raw buyer brief, transcript, token, or property-sensitive payload |
| PostHog | Inspect consented aggregate product behavior | OAuth, read-focused, project constrained | Privacy mode; no raw prompt/output/transcript; no capture before consent |
| Magic UI | Discover source examples for review | Registry read-only | No automatic component installation; repository primitives and design contract win |

Official configuration guidance:

- Supabase supports project scoping, read-only mode, feature groups, and interactive OAuth; it recommends non-production use. [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp)
- GitHub's official MCP server supports read-only mode, toolsets, allowlists, and remote OAuth. [GitHub MCP](https://github.com/github/github-mcp-server)
- Firecrawl supports hosted/OAuth and search-only forms; credentials must not be placed in URLs. [Firecrawl MCP](https://docs.firecrawl.dev/use-cases/developers-mcp)
- Sentry documents skill/scoping controls and an inspection-oriented read-only mode. [Sentry MCP](https://github.com/getsentry/sentry-mcp)
- PostHog's current endpoint is `https://mcp.posthog.com/mcp`; the older standalone repository is archived. [PostHog MCP](https://posthog.com/docs/model-context-protocol)
- Magic UI's MCP is a registry discovery surface, not a product runtime. [Magic UI MCP](https://magicui.design/docs/mcp)
- Codex supports stdio and streamable HTTP servers, OAuth, environment-backed bearer tokens, enabled-tool lists, and approval policies. [Codex MCP](https://developers.openai.com/codex/mcp/)

Configuration belongs in trusted user-level tooling unless a project config is intentionally reviewed. Secrets belong in environment-backed credential storage, never source, task prose, shell history, or a committed JSON file.

Each approved connector needs an executable operator profile before activation:

- owner and approval record;
- official endpoint and environment/project identifier;
- OAuth flow or justified credential alternative;
- allowed and explicitly denied tools;
- approval behavior and data classification;
- read-only success probe and write/production-denial probe;
- disable, revoke, rotate, audit-log review, and incident steps.

Connectors remain disabled by default. A connector matrix without its denial and revocation tests is guidance, not an operational control.

## Security and privacy audit

### Immediate actions before connector work

The credentials included in the supplied task material must be treated as exposed. Localhost scope does not make a bearer token safe. Rotate every pasted Supabase, GitHub, Firecrawl, Sentry, PostHog, and registry credential; review provider audit logs; remove stale tokens; reissue least-privilege credentials only if OAuth is unavailable. Do not copy the old values into this repository or an MCP configuration.

Repository and Git-history prefix scans did not find those concrete token forms. `.env.local` is ignored and contains configured local values, but the pasted values remain compromised independently of Git.

### Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| Critical | Plaintext provider credentials appeared in the supplied task material | User-supplied attachment/chat | Rotate, audit, revoke; use OAuth or environment-backed secrets |
| High | Recorded voice uses `@posthog/ai/gemini` with a server PostHog client and no privacy mode. The installed wrapper defaults to capturing formatted model input/output; this path is independent of browser analytics consent | `app/api/voice/turn/route.ts`, `lib/telemetry-server.ts`, installed package behavior | Set wrapper privacy mode and/or remove LLM payload capture; add a regression test proving transcripts and responses are absent |
| High | Sentry is configured with `tracesSampleRate: 1` across client, server, and edge, with no explicit scrubber or PII contract | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | Establish data classification, scrub/deny fields, set evidence-based sampling, and test envelopes |
| Medium | `.env.local` contains `FIRECRAWL_API_KEY` but `.env.example` does not document it | Local key/status-only inspection | Add an optional documented contract only when the connector is approved; otherwise remove the unused local key after rotation |
| Medium | `pnpm audit --audit-level high` reports two high advisories in `image-size@1.2.1`, transitively through Storybook's Next integration | Lockfile and `pnpm why image-size` | Upgrade the Storybook/tooling chain or constrain untrusted image processing; re-run audit |
| Informational | No `.github` workflows exist | Repository index | Define CI before making release-readiness claims |

PostHog documents privacy mode as the way to exclude AI input and output choices. It also documents explicit opt-in and replay masking controls. [AI privacy mode](https://posthog.com/docs/ai-observability/privacy-mode) · [data collection](https://posthog.com/docs/privacy/data-collection) · [replay privacy](https://posthog.com/docs/session-replay/privacy)

### Threat model and controls

| Threat | Control |
| --- | --- |
| Prompt injection from crawled pages or listing descriptions | Treat content as data; strip active instructions; source/URL allowlists; schema validation; never expose arbitrary tool execution |
| Model invents availability, ROI, delivery, or license state | Fetch typed canonical facts; closed evidence vocabulary; unknown means unknown; deterministic renderer |
| Leaked connector or service credential | OAuth, short-lived tokens, environment-backed secrets, rotation, log review, narrow scopes |
| Anonymous session takeover | Signed session binding, rotation on auth transitions, RLS, replay/idempotency controls |
| Cross-tenant access | JWT validation, owner-scoped queries/RPCs, RLS tests, no client-selected organization authority |
| Voice capture without meaningful consent | Explicit press, persistent state label, immediate stop, no raw audio persistence, transcript edit, documented telemetry behavior |
| Transcript or buyer intent in analytics | Privacy mode, denylisted properties, envelope tests, consent-aware client capture, aggregate identifiers |
| Duplicate inquiry/tool side effects | Prepare/confirm split, explicit consent, idempotency key, server authorization, no automatic retry |
| Unsupported regulatory representation | Source-specific states, timestamp, licensed-human escalation, copy review |

## Delivery plan

Each phase is a deployable vertical slice with an explicit gate. No phase depends on fabricated inventory or a production MCP connection.

### Phase 0 — Decision, credential containment, and measurement contract

**Outcome:** Option A is approved; the build has safe credentials and measurable starting conditions.

- Record the product-identity decision and non-goals.
- Rotate every exposed credential and inspect access/audit logs.
- Decide which MCPs are actually needed; prefer OAuth, remote official servers, read-only tools, and approval prompts.
- Remediate PostHog AI privacy and define a Sentry data-scrubbing/sampling contract.
- Establish baseline voice and discovery latency events without raw content.
- Classify every durable Decision Ledger field and define retention, buyer deletion/export, legal/audit retention, anonymous-session ownership, authenticated ownership, and auth-transition reconciliation before the first new ledger write.
- Add a dependency-advisory owner and remediation decision for Storybook/image-size.
- Add CI for lint, typecheck, tests, and build before release claims.
- Require an independent `RATE_LIMIT_SECRET` in hosted verification; never substitute the Gemini credential.
- Reconcile the environment contract and add key/status-only `pnpm env:check` plus `pnpm doctor` preflight commands.
- Define versioned, allowlisted Sentry/PostHog event envelopes, alert owners, dashboards, escalation, retention, privacy-canary evidence, and kill-switch steps.

**Gate:** no exposed credential remains valid; telemetry tests prove that raw audio, transcript, brief, model prompt/output, tokens, contact data, and protected identifiers are not captured; CI and the environment preflight are reproducible; hosted verification refuses shared provider/rate-limit secrets.

### Phase 1 — ICP, operating model, and licensed-supply feasibility

**Outcome:** Rama proves that one narrow buyer segment, one distribution lane, and one governed supply lane can support decision assurance before expanding the public experience.

- Run bounded discovery with serious cross-border buyers and licensed advisors; test the JTBD, highest-risk decisions, trust failures, acquisition route, and willingness to pay.
- Select one buyer segment, budget band, property segment, and partner/distribution hypothesis.
- Select one potential licensed provider and document data rights, attribution, freshness, availability, project/ad identifiers, media rights, failure modes, and commercial constraints.
- Prototype ingestion in isolated dev/staging using representative or contractually approved data only.
- Define the evidence vocabulary and claims registry; register or reject every existing public credibility claim.
- Decide the advisory operating boundary: software decision support, licensed introduction, or a separately licensed brokerage service.
- Define a pilot scorecard: evidence completeness, brief accuracy, decision progression, source freshness, advisor quality, and economics.

**Gate:** product owner, CTO, and legal/compliance owner agree on the ICP, monetization hypothesis, operating boundary, distribution lane, and feasible licensed source. If no source is yet feasible, the product remains an explicitly illustrative decision prototype and does not expand claims or handoff.

### Phase 2 — Truth-led landing foundation

**Outcome:** the landing clearly communicates the product and accepts equivalent text and voice briefs.

- Reconcile or remove the untracked Archivanta/Vellaro sections that introduce glass effects, fabricated scale, testimonials, or unsupported advisory claims.
- Keep the project-owned hero and Lottie assets; implement the approved editorial tokens and typography.
- Reduce the page to invitation, brief entry, process/provenance explanation, and restrained footer.
- Implement English/Arabic copy as structured content, with RTL and locale-aware formatting.
- Establish the locale-prefixed route foundation, legacy redirects, root `lang`/`dir`, locale restoration, Arabic font, and localized intercepted route before styling the final composition.
- Make all voice states legible without audio or animation.

**Gate:** rendered desktop/mobile/RTL review, keyboard-only completion, reduced-motion behavior, screen-reader status, and no horizontal overflow.

### Phase 3 — One brief, one route, one renderer

**Outcome:** every text and recorded/live voice path creates the same versioned search run and opens the same Decision Room.

- Make transcript and inferred criteria editable before persistence.
- Introduce the capture → normalize → review/edit → confirm state machine and a non-persisting Live `prepare_brief` tool.
- Make confirmed discovery submit idempotent and reject late or stale tool results.
- Keep one shared discovery service and envelope schema.
- Remove or quarantine legacy landing modal/result code so it cannot become a second truth surface.
- Verify direct navigation, refresh, Back/Forward, expired/missing run, and anonymous-to-authenticated binding.
- Add contract tests showing parity across entry points.

**Gate:** one canonical envelope and renderer; zero search-run writes before confirmation; one run after double-confirm or retry; cancel writes nothing; stale results cannot navigate; no path renders model-generated HTML or client-invented property truth.

### Phase 4 — Resilient live voice

**Outcome:** Live feels immediate when available and degrades honestly when it is not.

- Preserve short-lived token minting, config pinning, origin checks, fail-closed rate limiting, and no-store responses.
- Add structured client telemetry for state transitions and layered latency.
- Exercise VAD, barge-in, session expiry, reconnect, device denial, audio-output failure, offline loss, and recorded fallback.
- Test Arabic, English, and code-switching with real community names and currencies.
- Cap session cost and duration; surface the transition to recorded or typed input.

**Gate:** no leaked media/audio resources; no duplicate side effect on retry; documented P50/P95 baseline on representative devices and networks.

### Phase 5 — Evidence-first Decision Room

**Outcome:** the product helps a buyer reason, not merely browse.

- Introduce the explicit evidence-state vocabulary.
- Add the assertion/evidence schema through the expand-and-cutover sequence; keep a v1/v2 reader and shadow validation during rollout.
- Persist immutable as-seen snapshots and expose snapshot-versus-current differences.
- Show criteria, assumptions, match/mismatch reasons, freshness, and unknowns.
- Add delivery and supply-risk treatment without predicting certainty.
- Add deterministic scenario cards with visible inputs and sensitivity ranges.
- Add a durable Decision Ledger and comparison narrative.
- Keep advisor handoff disabled for illustrative records.

**Gate:** every rendered factual assertion resolves to an as-seen or canonical source record or is labeled buyer input/inference/unknown; snapshot/current differences survive source change or withdrawal; v1/v2 compatibility and scenario math have deterministic tests.

### Phase 6 — Licensed supply activation

**Outcome:** Rama can safely display a bounded set of licensed, attributable, freshness-governed records.

- Choose one licensed provider and one bounded geography/property segment.
- Land records in staging; normalize; validate ownership, publication, availability, price, media rights, source freshness, and attribution.
- Implement stale-data exclusion and provider-reconciliation alerts.
- Add DLD permit/broker checks only where lawful and technically reliable; represent each as its own assertion.
- Enable advisor handoff only for eligible records and licensed organizations.

**Gate:** contractual data rights reviewed; RLS and publication guards tested against cross-tenant and stale-record cases; provider failure is fail-closed.

### Phase 7 — Operator evidence loop

**Outcome:** product, engineering, and licensed advisors can improve decision quality without accessing unnecessary buyer content.

- Use Sentry for scrubbed error/performance investigation.
- Use PostHog for consented aggregate funnel and feature behavior, with AI privacy mode.
- Use GitHub/Supabase MCPs in read-only development workflows only.
- Use Firecrawl for approved-source research or staged ingestion; never directly in a buyer-facing tool call.
- Add advisor feedback fields for missing evidence, wrong criterion, stale source, and handoff outcome.

**Gate:** access matrix, the Phase 0 retention/deletion/export contract, incident response, and audit ownership are implemented and tested.

### Phase 8 — Compounding decision intelligence

**Outcome:** Rama learns which evidence and questions improve decisions without becoming an opaque recommender.

- Rank clarification questions by expected information gain.
- Measure which evidence changes shortlists or exposes an unknown.
- Build buyer-controlled saved criteria and cross-run comparison.
- Add model and prompt evaluations against a versioned golden set.
- Consider new geographies only after source/licensing and Arabic/English quality gates are repeatable.

**Gate:** improvements are explainable, reversible, evaluated across both locales, and do not infer protected or sensitive traits.

### Twelve-month direction — monitored decision assurance

If the pilot validates demand, rights, and economics, the compounding product should provide:

- multiple licensed sources normalized into one evidence contract;
- an English/Arabic buyer workspace with a persistent Decision Ledger;
- changed-fact alerts for price, availability, document, permit, or delivery evidence;
- buyer-controlled shareable decision memos;
- advisor continuity with consented context instead of a generic lead;
- transparent property and portfolio scenarios with disclosed assumptions;
- distribution through credible licensed partners rather than interface novelty alone.

The magic moment is not hearing a synthetic voice. It is the buyer realizing: **“I can defend this decision.”**

## Verification strategy

### Static and automated gates

Every implementation handoff runs:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Local green checks are not release readiness. Publish a machine-readable gate summary with separate evidence states for:

| Environment | Evidence |
| --- | --- |
| Local | lint, typecheck, unit/contract tests, build, env check, dependency audit |
| Preview | automated browser tests, privacy canary, deployed route/assets, mocked provider failure |
| Staging | real multi-identity RLS/RPC tests, Gemini/browser/audio verification, provider staging, backup/restore exercise |
| Production approval | reviewed CI artifacts, migration plan, rollout cohort, alerts/on-call, rollback owner, explicit activation record |

Absence of CI, hosted Supabase verification, deployed browser/audio evidence, backup/restore proof, or privacy proof must remain visible as “not verified,” never inferred from local checks.

Add focused coverage for:

- text, recorded voice, and Live brief parity;
- provenance and evidence-state invariants;
- illustrative-record handoff denial;
- transcript/AI-output telemetry redaction;
- RLS ownership and anonymous/authenticated session transitions;
- idempotent inquiry and tool side effects;
- Arabic and English schema/content parity;
- deterministic scenario math and unit/currency formatting;
- stale-provider and provider-outage fail-closed behavior.

Use explicit layers:

- **Vitest unit/contract:** schemas, state machines, brief confirmation, idempotency, math, redaction, locale parity, and v1/v2 readers.
- **Route/service tests:** origin/auth/rate-limit/timeout behavior, tool allowlists, stale-result rejection, and persistence boundaries.
- **Real Supabase integration:** migrations, RPCs, constraints, and RLS using anon, authenticated user A, authenticated user B, and service-role cases. SQL-text assertions are guards, not proof of hosted policy behavior.
- **Automated browser E2E:** add a reviewed Playwright setup for keyboard, routing, voice mocks/fallback, focus, mobile/desktop, and EN/AR. Until that exists, label responsive/RTL/keyboard evidence as manual rather than automated.

### Browser QA matrix

| Surface | Required checks |
| --- | --- |
| Landing | 320/390/768/1024/1280/1440, short desktop, EN/AR, RTL, text/voice, permissions denied, Live disabled, recorded fallback |
| Decision Room | route entry, client navigation, refresh, Back/Forward, missing/expired run, focus trap/return, comparison, shortlist, evidence expansion |
| Voice | keyboard, screen reader, reduced motion, barge-in, session timeout, reconnect, audio-output failure, mic stop/disposal |
| Inquiry | no consent, invalid contact, duplicate submit, illustrative candidate, eligible licensed candidate, provider failure |

Use `http://localhost`, not `127.0.0.1`, for Next.js browser QA.

Additional visual acceptance criteria:

- At 1280×720, wordmark, heading, promise, voice control, visible text input, status, and illustrative disclosure are visible without scrolling.
- At 320/390px, the heading can wrap intentionally and no element clips or creates horizontal overflow.
- Interactive targets are at least 44×44px; body copy is at least 16px; low-contrast 9–10px metadata is not used for essential meaning.
- Lottie is static while idle and under reduced motion.
- Keyboard flow covers microphone start/stop, transcript confirmation, route opening, dossier expansion, comparison, and focus return.
- RTL review includes wrapping, currencies/numbers, dates, mixed community names, icons, and media order.
- Illustrative candidates never expose an enabled advisor action.
- Every image used in the public experience has reviewed rights/provenance, focal crop rules, and localized alt text.

### Model evaluation

Create a versioned test set with:

- clear briefs, ambiguous briefs, contradictions, and missing budgets;
- Dubai community names in Arabic and English;
- currency, dates, bedrooms, school/commute/lifestyle constraints;
- requests for legal, tax, mortgage, guarantee, or unavailable live facts;
- malicious listing text and prompt-injection attempts;
- interruptions and self-corrections in speech.

Score extraction correctness, unsupported-claim rate, clarification quality, source use, locale quality, refusal/escalation behavior, and entry-point parity. Never use a single LLM judge as the only release gate for factual or authorization behavior.

## Product telemetry and success measures

### North-star behavior

**Qualified decision progression:** the proportion of legitimate search runs in which a buyer confirms a brief, inspects evidence, and completes a meaningful decision action such as comparison, criterion revision, shortlist, or an eligible consented handoff.

This avoids optimizing for microphone presses, chat length, property-card clicks, or raw lead volume.

### Supporting measures

- brief start → confirmed brief;
- confirmed brief → usable Decision Room;
- percent of inferred criteria edited or confirmed;
- evidence-open and unknown-resolution rates;
- comparison and shortlist quality signals;
- eligible handoff consent and delivery success;
- voice start/success/fallback/abandonment, by locale and device;
- P50/P95 layered voice and discovery latency;
- source freshness, exclusion, reconciliation, and provider-error rates;
- unsupported-claim, provenance, and evaluation failure rates;
- accessibility and RTL regressions;
- advisor feedback on missing or incorrect evidence.

Do not set vanity targets before a clean baseline. Define targets with sample size, segment, time window, and guardrails.

Critical-path telemetry is fail-open, bounded, and non-blocking. A PostHog or Sentry delay must not consume the Live tool-response budget or prevent a buyer result. Set explicit concurrency, session-duration, token/audio-cost, and provider-call ceilings before a percentage rollout.

## Rollout and rollback

Use independently reversible flags with stable cohort assignment for:

- landing composition;
- brief-confirmation state machine;
- locale-prefixed routes;
- evidence/envelope v2 writer and renderer;
- Live voice behavior;
- each licensed provider.

Provider connectors have kill switches and the application fails closed to a truthful unavailable or illustrative state. Rollback returns to compatible readers and the prior renderer; it does not delete data or reverse migrations.

Immediate rollback conditions:

- any cross-owner or cross-tenant data exposure;
- any raw transcript, buyer brief, model content, token, or protected field in telemetry;
- a provenance invariant failure;
- an enabled advisor action for an illustrative or ineligible record;
- duplicate side effects from confirmation, reconnect, or retry;
- a provider record published outside its rights or freshness rules.

## Developer and operator readiness

### Reproducible first run

Before Phase 2 implementation is handed off, documentation must provide:

- declared Node and pnpm prerequisites from `package.json`;
- a deterministic demo-mode quickstart from checkout to an illustrative text result, targeting under five minutes and requiring no production credentials;
- required versus optional, client versus server, and local/preview/staging/production environment variables;
- expected output and safe cleanup;
- a separate connected-development guide for Supabase and Gemini;
- a documented running-server requirement for Gemini verification, or one orchestration command that starts, waits, verifies, and stops cleanly;
- `pnpm env:check` that validates keys/status only and tests accidental `NEXT_PUBLIC_` exposure;
- `pnpm run doctor` that checks runtime, package manager, environment, port, and approved-provider reachability without printing secrets.

Add a documentation index covering product contract, architecture, quickstart, environment contract, connector profiles, operator/privacy runbooks, this plan, release evidence, and decision history. Link this plan from the README only after the product-identity decision is approved.

### Work-package contract

Convert each approved phase into backlog items with:

- priority and accountable owner;
- required product, legal/compliance, provider, security, or engineering authority;
- prerequisites and dependent task IDs;
- files, routes, tables/RPCs, schemas, or interfaces in scope;
- automated command and manual evidence required;
- feature flag and stable cohort rule;
- rollback action and kill switch;
- completion artifact and phase-gate evidence bundle.

Dependency spine:

```text
identity approval
  -> credential/privacy containment + CI/env truth
  -> ICP/operating model/licensed-source feasibility
  -> locale route foundation
  -> confirmation state machine + idempotent submit
  -> evidence/snapshot v2 expand + compatible reader
  -> feature-flagged Decision Room
  -> resilient Live adaptation
  -> licensed provider staging/publication gate
  -> operator telemetry and measured optimization
```

Production activation remains a separate approval event even when every implementation task is complete.

## Non-goals

- Becoming a full-market portal before licensed coverage exists.
- Treating the landing page as a second Decision Room.
- Voice-only access.
- Autonomous financial, legal, tax, mortgage, valuation, or investment advice.
- Guaranteed yield, appreciation, delivery, availability, or response-time claims.
- AI-generated property facts without retrievable evidence.
- Unconsented lead capture or analytics.
- Production database access through a general-purpose MCP.
- Automatic installation of fashionable UI effects.
- Deployment, merge, or launch-readiness claims from local green tests alone.

## Settled decision and remaining gates

| Decision | Recommendation | Owner | Deadline relative to build |
| --- | --- | --- | --- |
| Product identity | **SETTLED: Option A, governed voice-first Decision OS** | CTO | Approved 22 August 2026 |
| Licensed-supply pilot | One provider, one segment, contractual rights first | Product + legal + CTO | Phase 1 feasibility; before Phase 6 activation |
| Locale launch | Locale-prefixed EN/AR architecture and content parity | Product + CTO | Phase 2, before copy freeze |
| Analytics content policy | No raw prompt, transcript, brief, or model output | Privacy + CTO | Phase 0 |
| Voice SLO | Establish baseline, then set P50/P95 targets | CTO | End Phase 4 baseline |
| Illustrative art direction | Two visual theses, not exclusive inventory | Design + Product | Phase 2 |
| MCP activation | Only approved purpose, official remote/OAuth/read-only | CTO + Security | Per connector |

## Decision audit trail

| # | Review lens | Decision | Why | Alternative rejected |
| --- | --- | --- | --- | --- |
| 1 | Product | Keep “browse, then personalize” | Allows trust before data capture | Forced lead gate |
| 2 | Product | Voice-first, not voice-only | Faster expression with accessible parity | Microphone as sole entry |
| 3 | Architecture | Preserve route-first Decision Room | Durable state, recovery, one renderer | Landing modal/results gallery |
| 4 | Market | Compete on decision quality and evidence | Natural-language search already exists | “AI chat” as moat |
| 5 | Trust | Make provenance a typed data contract | High off-plan share and ad governance demand precision | Decorative “verified” badge |
| 6 | Content | Keep illustrative records explicit | No licensed provider is connected | Imply live availability |
| 7 | Design | Use architectural pair as editorial theses | Strong point of view without narrowing catalog truth | Exclusive villa/pavilion inventory |
| 8 | AI | Model interprets; application retrieves/renders | Preserves authorization and fact boundaries | Model-generated UI/facts |
| 9 | Voice | Measure layered latency | Preview API/network/tool variance makes one promise misleading | Unsupported sub-250ms claim |
| 10 | MCP | Operator tooling only, least privilege | MCP does not replace product boundaries | Production/general write access |
| 11 | Privacy | No raw buyer or model content in telemetry | Buyer intent is sensitive and browser consent is insufficient for server capture | Default AI tracing |
| 12 | Delivery | Vertical slices with truth gates | Each phase is independently testable and reversible | Big-bang visual rewrite |
| 13 | Company | Validate supply rights, distribution, and economics in Phase 1 | Interface distinction alone is not a business | Postpone operating model until after redesign |

## Source register

Market and regulatory sources were checked on 22 August 2026. Vendor product pages describe their own capabilities and should be treated as vendor claims, not independent validation.

- [DLD 2025 market milestone](https://www.protocol.dubai.ae/en/media-listing/news-events/dubai-s-real-estate-market-records-new-historic-milestone-with-transactions-exceeding-aed917-billion-in-2025/)
- [DLD Q1 2026 transactions](https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026)
- [DLD 2025 rental sector](https://dubailand.gov.ae/en/news-media/dubai-s-rental-sector-records-strong-growth-in-2025-underscoring-market-stability-and-the-strength-of-the-emirate-s-real-estate-ecosystem)
- [DLD 2033 strategy](https://dubailand.gov.ae/en/news-media/dubai-real-estate-sector-strategy-2033-poised-to-drive-significant-growth-in-transactions-and-international-investments/)
- [DLD rules and circulars](https://dubailand.gov.ae/en/about-dubai-land-department/rules-regulations/)
- [CBRE UAE market review Q4 2025](https://www.cbre.ae/press-releases/uae-real-estate-market-review-q4-2025)
- [CBRE UAE market review Q1 2026](https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q1-2026)
- [Knight Frank Dubai residential review Q4 2025](https://www.knightfrank.ae/newsroom/article/2026/2/dubai-residential-market-review-q4-2025)
- [Knight Frank Dubai residential review Q1 2026](https://www.knightfrank.ae/site-assets/pdf/2026/dubai-residential-market-review-q1-2026.pdf)
- [Knight Frank Dubai luxury sales H1 2026](https://www.knightfrank.ae/newsroom/article/2026/7/dubai-us%24-10m-residential-sales-analysis-q2-2026)
- [Gemini Live API documentation](https://ai.google.dev/gemini-api/docs/live-api)
- [Gemini Live session management](https://ai.google.dev/gemini-api/docs/live-api/session-management)
- [W3C form guidance](https://www.w3.org/WAI/tutorials/forms/)

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | ---: | --- | --- |
| CEO Review | `/plan-ceo-review` via full pending-task audit | Scope, product, and market thesis | 2 | `CLEAR` | Refreshed primary sources continue to support decision assurance over portal or voice novelty |
| Eng Review | `/plan-eng-review` via full pending-task audit | Architecture and tests | 2 | `CLEAR (LOCAL)` | P0-P8 repository scopes are implemented; concurrency, publication, evidence-age, and generated-type findings are resolved in the current tree |
| Design Review | `/plan-design-review` via full pending-task audit | UI, state, accessibility, and RTL | 2 | `CLEAR (REPOSITORY)` | Responsive/RTL/state automation exists; documentary asset rights and real assistive-device evidence remain open |
| DX Review | `/plan-devex-review` via full pending-task audit | Developer and operator readiness | 3 | `CLEAR (DEVELOPMENT)` | Credential-free demo, diagnostics, environment contract, and ephemeral hosted identity verification work; staging deployment and evidence owners remain external |
| Security Review | `/cso` via full pending-task audit | Credentials, dependencies, auth, privacy | 3 | `CLEAR (DEVELOPMENT) / PRODUCTION BLOCKED` | Development migrations, public/private RLS posture, function ACLs, and two-user isolation pass; production rotation, legal, and operational evidence remain mandatory |

**CROSS-REVIEW:** Product, engineering, design, DX, and security checks agree on the same boundary: repository implementation is complete, but local green gates do not authorize licensed supply or production.

**CTO DECISION:** Keep Option A and move the project from implementation backlog to external validation and activation evidence. Continue local development with independent throwaway secrets; rotate and bind persistent production credentials at the release gate.

**VERDICT:** CEO + ENG + DESIGN + DX + LOCAL SECURITY CLEARED. Production remains unauthorized until every external gate in `docs/CTO_PLAN_PENDING_TASK_AUDIT.md` is proven with current evidence.

NO UNRESOLVED DECISIONS

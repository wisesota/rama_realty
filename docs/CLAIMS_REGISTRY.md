# Claims registry v1

Public claims must have an identifier, evidence owner, source, observation date, exact approved wording, expiry, and review state. Unregistered credibility, performance, inventory, customer, partner, or regulatory claims are prohibited. Dates use ISO `YYYY-MM-DD`; an expired entry is not approved public copy.

| ID | State | Owner | Source | Observed | Expires | Exact approved or rejected wording |
| --- | --- | --- | --- | --- | --- | --- |
| `PRODUCT-001` | approved | CTO | `tests/discovery-entrypoints.test.ts` | 2026-08-22 | 2026-09-22 | “Voice-led Dubai property discovery with explainable criteria.” |
| `INVENTORY-001` | approved | CTO | `lib/public-catalog-repository.ts` | 2026-08-22 | 2026-09-22 | “Current results are illustrative until licensed inventory is connected.” |
| `HANDOFF-001` | approved | CTO | `lib/agent/tools-server.ts` | 2026-08-22 | 2026-09-22 | “Illustrative residences cannot be sent to an advisor.” |
| `SOURCE-001` | approved | CTO | `lib/agent/buyer-contracts.ts` | 2026-08-22 | 2026-09-22 | “Property facts show their source and observation state when available.” |
| `LICENSE-001` | rejected | CTO | `docs/PHASE_1_OPERATING_THESIS.md` | 2026-08-22 | 2026-09-22 | “Rama is a licensed brokerage or provides regulated investment advice.” |
| `SCALE-001` | rejected | CTO | no approved evidence | 2026-08-22 | 2026-09-22 | “Customer counts, transaction volume, years of experience, ratings, testimonials, or market-leader language.” |
| `SUPPLY-001` | rejected | CTO | `docs/LICENSED_SUPPLY_ACTIVATION.md` | 2026-08-22 | 2026-09-22 | “Live, exclusive, verified, vetted, or off-market inventory.” |
| `RETURN-001` | rejected | CTO | prohibited forecast or guarantee | 2026-08-22 | 2026-09-22 | “Guaranteed ROI, appreciation, yield, completion, availability, or resale outcome.” |

Named advisors, partners, developers, awards, press logos, and buyer stories require written rights plus a claim entry. Market statistics require a source date and an expiry no longer than 90 days for public copy. Product code should prefer factual state labels over credibility adjectives.

# Voice reliability evidence

The two-run Gemini check proves credentials, entitlement, and basic protocol compatibility. It is not reliability evidence. Activation requires a separate privacy-safe staging run for the exact release SHA, validated by `pnpm verify:voice-reliability` and the machine policy in `voice-reliability-policy.json`.

## Required coverage

- At least 100 independent turns, including at least 60 live-provider turns and the six injected failure outcomes in the policy.
- Three or more live-provider turns for every required profile. Safari means actual desktop Safari and iPhone Safari in the device lab; Playwright WebKit alone is not labeled Safari evidence.
- Chromium desktop and mobile, Firefox desktop, Safari desktop and mobile; EN and AR; Wi-Fi, shaped Fast 3G, and shaped lossy service.
- The deployed staging release, provider configuration, Supabase project, rollout flags, and 40-character release SHA remain constant for the evidence set.
- Permission denial, token timeout, socket timeout, provider close/GoAway, reconnect exhaustion, and recorded fallback are deliberately exercised. Injected faults are reported separately and excluded from the nominal live-provider success rate.

## Statistics and activation budgets

The validator reports nearest-rank P50/P75/P95/P99 for token, socket, first-server-event, first-audio, and total-turn latency, plus live-provider success, error, and unexpected-fallback rates. The initial policy requires at least 98% nominal success, no more than 2% unexpected fallback, P95 first audio at or below 12 seconds, and P99 first audio at or below 20 seconds; the remaining stage budgets are explicit in the JSON policy.

These are pre-pilot activation budgets, not claims that current production meets an SLO. Product, operations, and the provider owner must approve them before the first evidence run. Do not relax a threshold after observing the data; change the policy in a reviewed commit and collect a new evidence set.

## Machine-readable storage

The input JSON contains only controlled dimensions, categorical outcomes, integer millisecond timings, run IDs, timestamps, authority, and release SHA. It must not contain transcript text, audio, prompts, property criteria, contact data, buyer/session IDs, tokens, or secrets. The contract recursively rejects forbidden field names.

Run:

```powershell
pnpm verify:voice-reliability -- --input <private-evidence.json> --output artifacts/voice-reliability-assessment.json
```

Store the input in a private, access-logged evidence bucket with the approved retention period. Store the smaller assessment beside it, record SHA-256 for both, and reference the immutable assessment in `production-activation.json`. The assessment contains aggregates and blocker codes, not raw turns. A passing result expires after 24 hours and is invalid if the release SHA or staging configuration changes.

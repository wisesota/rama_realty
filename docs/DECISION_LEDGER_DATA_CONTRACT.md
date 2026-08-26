# Decision Ledger data contract v2

No v2 writer may ship until this contract is represented in schema, RLS, retention jobs, export/deletion paths, and renderer tests.

## Ownership

- Anonymous records belong to one opaque, hashed buyer-session owner and expire after 30 days of inactivity.
- Authentication rotates the token and binds the stable buyer-session owner in one transaction.
- A user mismatch on a shared browser revokes prior anonymous ownership instead of merging it.
- Organization ownership applies only after a licensed, consented handoff; membership never grants access to unrelated buyer records.

## Field classes

| Field group | Examples | Class | Rule |
| --- | --- | --- | --- |
| Credentials | raw token, provider key | restricted | never store in ledger; hashes only where required |
| Buyer content | raw brief, transcript, inferred criteria | restricted PII/intent | encrypted platform storage, owner-scoped, export/delete |
| Contact and consent | email, phone, purpose, destination, policy version | restricted PII | write only on explicit handoff; immutable consent evidence |
| Decision evidence | assertion, value, unit, source, observed time, content hash | confidential | immutable as-seen snapshot plus current comparison |
| Property identity | source record/project/ad/permit identifiers | confidential/licensed | contractual rights and expiry required |
| Product telemetry | event name, coarse outcome/buckets | internal | allowlisted aggregate only; no protected identifiers |
| Public catalog | licensed published facts and attribution | public only while rights/publishing state are valid | fail closed on expiry/removal |

## Required v2 record

Each decision event stores schema/envelope/parser versions, action type, actor class, timestamp, immutable as-seen assertions, source identifier and observation time, rights/attribution state, content hash, and optional supersession link. Current canonical assertions are resolved separately. The renderer must show changed, expired, withdrawn, or corrected facts instead of rewriting history.

Raw audio is never a ledger field. Model output is never evidence. A calculation stores inputs, formula/version, assumptions, and result; a recommendation stores the buyer criterion it addresses and the governed assertions it used.

## Lifecycle

- Source rights expiry prevents new display/handoff and marks the as-seen record unavailable except where lawful audit retention applies.
- A correction appends a superseding event and renders the difference.
- Buyer deletion removes eligible buyer content and ownership links; lawful audit exceptions retain only the minimum pseudonymized evidence with a reason/expiry.
- Export is deterministic, versioned JSON plus human-readable HTML/PDF later; it never includes internal secrets or another tenant's data.
- Retention enforcement and processor deletion require auditable jobs before production activation.

## Repository implementation

Migration `20260822180000_buyer_data_rights_and_retention.sql` represents this lifecycle in the repository: versioned authenticated and current-browser exports, serialized transactional deletion, minimized time-bounded audit exceptions, a service-only processor-deletion outbox with an actionable retained locator, per-row fenced leases, honest `processor_pending` request state, and dry-run-first retention enforcement that preserves unresolved erasure work. `GET`, `POST`, and `DELETE /api/buyer-data` expose the buyer-controlled path without granting browser roles direct operational-table access. Authenticated deletion requires an email step-up whose one-time authorization is bound to and consumed by the resulting Auth session. The ordered migration chain parses and installs in an embedded PostgreSQL compatibility check, while hosted RLS/Auth verification, legal approval, approved idempotent processor-adapter activation, and scheduling remain production gates.

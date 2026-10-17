<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Application architecture
- Keep account authorization in Cloud roles and row policies, never persisted UI state, so employees cannot grant themselves administrative access.
- Store private invoice originals by owner; extract fields server-side and use a deterministic rule engine with fail-closed human review, so AI never controls payments or vendor verification.
- Persist supplier invoice identifiers separately from internal record IDs and leave absent extracted fields null, so document numbers are never fabricated.
- Keep protected invoice pages under the authenticated layout and legal/landing/auth pages public, so document access and legal information have separate boundaries.
- Keep admin category, rule and audit views in the shared authenticated workspace, reading persisted rules and immutable invoice events rather than generating demo history.
- Calculate admin spend from approved invoice amounts by issue date and currency, paginate authorized source rows independently of inbox limits, and exclude missing fields instead of inferring payments or exchange rates.
- Keep fonts local and optional trackers absent unless explicitly added with a reviewed consent flow, to minimize third-party data exposure.
- Keep real-document uploads gated until operator contacts, processor arrangements and retention are verified; document the gate in the policy module.

- Match merchants against admin-confirmed exact aliases or explicit trailing-star prefixes; conflicting matches require review, blocked matches reject, and allowed matches still require financial rules. Preserve the original descriptor and snapshot the canonical match for auditing.
- An employee-view preview may only narrow what an admin sees; it must never grant access, because authorization lives in Cloud roles and row policies.
- For challenge decisions, finance confirms supplier tax and invoice references independently; deterministic matching and database-serialized budget reservations govern approvals, while legacy security demos remain isolated and cannot certify identity or fraud.
- Count budget reservations by approval timestamp in Bogotá calendar periods and currency, not issue-date spend charts; hard limits also bind manual approval to prevent simultaneous overspend.
- Persist provider-reported AI usage separately from monetary charges and audit decision transitions transactionally, so no synthetic token price or partial decision history is presented as real billing.
- Apply company and uploader-scoped budgets together inside the serialized database guard, counting only matching uploader reservations for personal caps, so manual and concurrent approvals cannot bypass limits.
- Keep synthetic transfer scenarios on a separately labeled workspace view with persisted private PDFs, employee accounts and zero AI calls; authorize every evaluation server-side. Account switching requires admin-authorized single-use access, verified synthetic employee-only accounts and explicit confirmation, never client-assigned roles.
- Store supplier reference attachments privately with admin-only records and server-side extraction; changes invalidate finance confirmation, future decisions compare deterministic metadata and confirmed bank references, and QR attachments never authorize payments or replace invoice attestations. Enforce the synthetic-reference gate with approved file-content hashes until real-document processing is enabled.

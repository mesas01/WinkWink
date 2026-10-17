# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Finance admins** at companies running cross-border payables on Blinka. They configure approval rules (per-payment and per-period limits, allowed beneficiaries, human-approval thresholds), work the exception queue, and approve or reject what the agent halted.
- **Employees** who submit invoices. They see their own invoices and the status and explanation the agent assigned to each. They never see rules or override controls.

## Product Purpose
WinkWink is an AI governance and anti-fraud agent for accounts payable inside Blinka (YC-backed cross-border fintech infrastructure: multi-currency accounts and global corporate payments over ACH, Wire, Bre-B and Pix). For each invoice it extracts who, how much, which currency and when it is due. It checks the beneficiary against verified vendor references and then decides one of three outcomes: pay, halt for human review, or escalate. Success means a high share of rule-compliant invoices clears without a human bottleneck, zero out-of-policy or fraudulent payments are approved, and every decision has a plain-language reason a reviewer can trust.

## Positioning
WinkWink does not let the AI control money. Extraction can use AI, but a deterministic rule engine decides and fails closed. A bank account on the invoice that differs from the vendor's pre-verified account triggers an immediate security block. Every decision is written to an immutable, explained audit log.

## Operating Context
- Built for the 30X Hackathon (HackRadar), Blinka challenge. Judges score autonomy, safety/anti-fraud, explainability and code modularity (tree-sitter AST scan).
- The flow ends at the decision. No real money moves and the product connects to no payment platform. Opening accounts, KYB/identity verification, compliance/fraud adjudication and Blinka's own app design are out of scope.
- Bilingual: Spanish (default) and English.

## Capabilities and Constraints
- Stack: TanStack Start + React 19, Tailwind v4, shadcn/Radix UI, framer-motion, sonner, zustand. Backend: Lovable Cloud / Supabase (auth, Postgres with RLS, private storage). The backend stays as is.
- Roles live in Cloud roles and row policies, never in client state. The "employee view" preview may only narrow what an admin sees.
- Decision states: approved (simulated payment), human review / halted, rejected, security blocked, pending, processing, error.
- Real-document uploads stay gated. Only synthetic test documents are allowed.

## Brand Commitments
- Name: WinkWink. Made for the Blinka challenge; Blinka's own brand is not to be imitated.
- Voice: plain, factual and calm. Never claim that payments were executed.

## Evidence on Hand
- Synthetic test invoice corpus: `src/assets/test-invoices/` (BR and CO scenarios).
- No real customers, testimonials, metrics or pricing exist. Do not fabricate any.

## Product Principles
1. The agent decides, people stay in control. Every exception has a clear owner and action.
2. Safety beats speed. When in doubt, halt; on an account mismatch, block.
3. Every decision explains itself in one sentence.
4. Show only what the role is allowed to act on.

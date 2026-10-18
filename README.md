# WinkWink

AI governance and anti-fraud agent for accounts payable on Blinka. Built for the 30X Hackathon (Blinka challenge).

For each invoice, WinkWink extracts who is being paid, how much, in which currency and when it is due. It checks the bank account against the vendor's pre-verified account in Blinka and decides one of three outcomes: **approve**, **hold for human review** or **security block**. Every decision is explained in one sentence and written to a typed audit log. No money moves: the flow ends at the decision.

## The agent (`/agente`)

| Step | What happens | Code |
|---|---|---|
| A. Extraction | Gemini reads the text, PDF or image and returns strict JSON: `vendor`, `amount`, `currency`, `category`, `invoice_bank_account`, and more. Missing fields stay `null`. | `src/services/geminiAgent.ts` |
| B. Anti-fraud | The invoice's account (and Tax ID) is compared with the verified vendor. A mismatch causes `SECURITY_BLOCKED`, which can never be approved. | `src/domain/agent/antifraud.ts`, `bank.ts` |
| C. Rules | Configurable rules decide the outcome. Review rules take priority, and when no rule matches the invoice is held (fail-closed). | `src/domain/agent/rules.ts` |
| D. Audit | One typed event per step (`kind`, `actor`, `supersedes`). An admin override replaces the decision in force, and the replaced decision is shown struck through. | `src/domain/agent/audit.ts`, `decide.ts` |

The AI only extracts. The decision is deterministic and covered by tests (`src/test/agent-engine.test.ts`).

Demo roles (local state): **Employee** sees their own invoices with status and reason. **Finance admin** also sees the rules, verified vendors, metrics and override buttons.

## Run it

```sh
npm install
cp .env.example .env   # add GEMINI_API_KEY (server-only)
npm run dev            # http://localhost:8080/agente
```

`GEMINI_MODEL` is optional (default `gemini-3.8-flash`; older Flash models such as 1.5 and 2.5 are no longer offered to new keys). Without a key, the agent uses labelled local text extraction so the demo still works.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Stack

TanStack Start, React 19, Tailwind v4, shadcn/Radix, zustand, Supabase (auth and the main dashboard). Design system in `DESIGN.md`.

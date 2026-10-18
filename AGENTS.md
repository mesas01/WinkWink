# AGENTS.md

Guidance for coding agents working in this repository.

## What this is

WinkWink: an AI governance and anti-fraud agent for accounts payable on Blinka (30X Hackathon).
The AI only **extracts** invoice fields; a deterministic engine **decides** (approve, hold,
security-block, reject) and writes a typed audit log. No money ever moves.

## Layout

- `src/domain/agent/`: pure, deterministic engine (types, bank match, anti-fraud, rules, decision, audit). No I/O.
- `src/services/`: server-only code. Gemini extraction (`geminiAgent.ts`), server functions, rate limit and access-code guard, PDF text-layer reader.
- `src/stores/agent-store.ts`: demo state for `/agente` (browser-persisted).
- `src/components/agent/`, `src/routes/agente.tsx`: the public agent demo.
- `src/routes/_authenticated/`, `src/lib/invoices.*`: signed-in dashboard on Supabase (auth, RLS, private storage).
- `supabase/setup.sql`: full database setup for a new Supabase project. `supabase/make-admin.sql`: grant the finance admin role.
- `test-invoices/`: synthetic PDFs (`npm run invoices:generate`). `scripts/record-demo.mjs`: narrated demo video.

## Commands

```bash
npm run dev          # http://localhost:8080
npm test             # vitest
npm run lint
npx tsc --noEmit
npm run build
```

## Rules

- Keep the AI to extraction. Decisions stay in `src/domain/agent` and must be deterministic and tested.
- Fail closed: missing data, unknown vendors and unverifiable accounts are held; a bank or tax ID mismatch is a security block that can never be approved.
- Never say a payment was executed. The approved state is "Aprobada / Approved", never "Paid".
- Secrets stay server-side (`process.env` in `*.server.ts` or server functions). Never commit `.env`.
- Roles live in Supabase roles and row policies, never in client state. The `/agente` roles are an explicitly labelled demo.
- Every user-facing string exists in Spanish (default) and English.
- UI follows `DESIGN.md` (clean glass): one blue accent, status only in pastel chips, no glass on glass, motion respects reduced-motion.

import { Check, Loader2 } from "lucide-react";
import type { AgentStep } from "@/hooks/use-agent-run";
import { cn } from "@/lib/utils";

const STEPS = [
  { es: "Lectura y extracción (Gemini)", en: "Read & extract (Gemini)" },
  {
    es: "Antifraude: cuenta vs. proveedor verificado",
    en: "Anti-fraud: account vs. verified vendor",
  },
  { es: "Reglas de la empresa", en: "Company rules" },
  { es: "Registro de auditoría", en: "Audit log" },
];

/** The agent's four steps, A to D, as it works through an invoice. */
export function AgentRunSteps({
  step,
  running,
  es,
}: {
  step: AgentStep;
  running: boolean;
  es: boolean;
}) {
  if (step === 0) return null;
  return (
    <ol aria-live="polite" className="mt-4 grid gap-1.5 text-sm">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = step > n || (step === 4 && !running);
        const active = step === n && running;
        return (
          <li
            key={s.en}
            className={cn("flex items-center gap-2", !done && !active && "text-muted-foreground")}
          >
            <span className="typed w-5 text-xs font-bold text-ink-violet">
              {String.fromCharCode(64 + n)}
            </span>
            {done ? (
              <Check className="size-4 text-foreground" />
            ) : active ? (
              <Loader2 className="size-4 animate-spin text-ink-violet" />
            ) : (
              <span className="size-4" />
            )}
            <span className={cn(done && "font-semibold")}>{es ? s.es : s.en}</span>
          </li>
        );
      })}
    </ol>
  );
}

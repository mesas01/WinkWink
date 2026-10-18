import { Switch } from "@/components/ui/switch";
import { ruleLabel } from "@/domain/agent/rules";
import { useAgentStore } from "@/stores/agent-store";

/** Admin only. Review rules outrank approval rules; anything no rule covers is held. */
export function RulesPanel({ es }: { es: boolean }) {
  const { rules, toggleRule } = useAgentStore();
  return (
    <section>
      <p className="max-w-2xl text-sm text-muted-foreground">
        {es
          ? "El agente solo aprueba lo que cumple una regla activa. Las reglas de revisión tienen prioridad, y lo que ninguna regla cubre queda retenido. Las monedas no se convierten."
          : "The agent only approves what an active rule allows. Review rules take priority, and anything no rule covers is held. Currencies are not converted."}
      </p>
      <ul className="mt-5 border-y-2 border-rule">
        {rules.map((r, i) => (
          <li
            key={r.id}
            className="flex items-center gap-4 border-b border-dashed border-input py-4 last:border-b-0"
          >
            <span className="typed text-sm font-bold text-ink-violet">R{i + 1}</span>
            <label htmlFor={`rule-${r.id}`} className="min-w-0 flex-1 font-semibold">
              {ruleLabel(r, es)}
            </label>
            <Switch
              id={`rule-${r.id}`}
              checked={r.enabled}
              onCheckedChange={() => toggleRule(r.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

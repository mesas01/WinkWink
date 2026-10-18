import type { AuditKind, DecisionStatus } from "@/domain/agent/types";

interface KpiProps {
  statuses: (DecisionStatus | null)[];
  /** Kind of the decision event in force per invoice; autonomy counts only rule approvals. */
  kinds: (AuditKind | null)[];
  es: boolean;
}

const count = (list: (DecisionStatus | null)[], s: DecisionStatus) =>
  list.filter((x) => x === s).length;

/** Judging metrics computed from the decisions in force: autonomy, holds and security blocks. */
export function AgentKpis({ statuses, kinds, es }: KpiProps) {
  const decided = statuses.filter((s) => s !== null);
  const approved = kinds.filter((k) => k === "rule_approved").length;
  const autonomy = decided.length ? Math.round((approved / decided.length) * 100) : 0;
  const items = [
    {
      label: es ? "Autonomía (aprobadas sin humano)" : "Autonomy (approved, no human)",
      value: `${autonomy}%`,
    },
    {
      label: es ? "Retenidas para revisión" : "Held for review",
      value: String(count(statuses, "HALTED_FOR_REVIEW")),
    },
    {
      label: es ? "Bloqueos de seguridad" : "Security blocks",
      value: String(count(statuses, "SECURITY_BLOCKED")),
      red: true,
    },
    {
      label: es ? "Sin evaluar" : "Not evaluated",
      value: String(statuses.length - decided.length),
    },
  ];
  return (
    <dl className="grid grid-cols-2 border-y-2 border-rule md:grid-cols-4">
      {items.map((k) => (
        <div
          key={k.label}
          className="border-b border-dashed border-input px-4 py-3 md:border-b-0 md:border-l md:first:border-l-0"
        >
          <dt className="text-xs text-muted-foreground">{k.label}</dt>
          <dd
            className={
              k.red && k.value !== "0"
                ? "typed text-2xl font-bold text-ink-red"
                : "typed text-2xl font-bold"
            }
          >
            {k.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

import { Stamp } from "@/components/stamp";
import { decisionStampTone } from "@/lib/stamp";
import type { DecisionStatus } from "@/domain/agent/types";
import type { AgentInvoice } from "@/stores/agent-store";
import { cn } from "@/lib/utils";

interface QueueProps {
  invoices: AgentInvoice[];
  statusOf: (id: string) => DecisionStatus | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  showSubmitter: boolean;
  es: boolean;
}

const amountOf = (i: AgentInvoice) => {
  const x = i.extraction?.invoice;
  return x?.amount != null
    ? `${x.currency ?? ""} ${x.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : "—";
};

export function AgentQueue({
  invoices,
  statusOf,
  selectedId,
  onSelect,
  showSubmitter,
  es,
}: QueueProps) {
  if (invoices.length === 0)
    return (
      <p className="border-y-2 border-rule py-10 text-center text-sm text-muted-foreground">
        {es ? "No hay facturas en esta vista." : "No invoices in this view."}
      </p>
    );
  return (
    <ul className="border-y-2 border-rule">
      {invoices.map((i) => {
        const tone = decisionStampTone(statusOf(i.id));
        const selected = i.id === selectedId;
        return (
          <li key={i.id} className="border-b border-dashed border-input last:border-b-0">
            <button
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(i.id)}
              className={cn(
                "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3 py-3.5 text-left transition-colors hover:bg-card",
                tone === "blocked" && "bg-destructive-soft/50",
                selected && "bg-card shadow-[inset_3px_0_0_var(--ink-violet)]",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{i.title}</span>
                <span className="typed block truncate text-xs text-muted-foreground">
                  {i.id}
                  {showSubmitter && ` · ${i.submittedBy}`}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <span className="typed text-sm font-bold">{amountOf(i)}</span>
                <Stamp tone={tone} es={es} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

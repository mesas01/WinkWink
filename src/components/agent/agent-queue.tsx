import { motion } from "framer-motion";
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
      <p className="surface-group py-10 text-center text-sm text-muted-foreground">
        {es ? "No hay facturas en esta vista." : "No invoices in this view."}
      </p>
    );
  return (
    <ul className="surface-group">
      {invoices.map((i, index) => {
        const tone = decisionStampTone(statusOf(i.id));
        const selected = i.id === selectedId;
        return (
          <motion.li
            key={i.id}
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.32,
              delay: Math.min(index, 8) * 0.04,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="border-b border-hairline last:border-b-0"
          >
            <button
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(i.id)}
              className={cn(
                "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3 py-3.5 text-left transition-colors hover:bg-card",
                tone === "blocked" && "bg-destructive-soft/50",
                selected && "bg-primary-soft/60 shadow-[inset_3px_0_0_var(--brand)]",
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
          </motion.li>
        );
      })}
    </ul>
  );
}

import { useMemo } from "react";
import { Check, Lock, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Stamp } from "@/components/stamp";
import { BankMismatch } from "@/components/security-detail";
import { AgentRunSteps } from "./agent-run-steps";
import { AuditLog } from "./audit-log";
import { decisionStampTone } from "@/lib/stamp";
import { currentDecisionEvent, eventsFor } from "@/domain/agent/audit";
import { categoryLabel } from "@/domain/agent/rules";
import type { DecisionStatus } from "@/domain/agent/types";
import type { useAgentRun } from "@/hooks/use-agent-run";
import { useAgentStore, type AgentInvoice, type AgentRole } from "@/stores/agent-store";

interface DetailProps {
  invoice: AgentInvoice;
  status: DecisionStatus | null;
  role: AgentRole;
  agent: ReturnType<typeof useAgentRun>;
  es: boolean;
  lang: string;
}

function ExtractedFields({ invoice, es }: { invoice: AgentInvoice; es: boolean }) {
  const x = invoice.extraction?.invoice;
  if (!x) return null;
  const none = "—";
  const rows: [string, string][] = [
    [es ? "Proveedor" : "Vendor", x.vendor ?? none],
    [es ? "Monto" : "Amount", x.amount != null ? `${x.currency ?? ""} ${x.amount}` : none],
    [es ? "Categoría" : "Category", categoryLabel(x.category, es)],
    [es ? "Cuenta en la factura" : "Invoice bank account", x.invoiceBankAccount ?? none],
    ["Tax ID / NIT", x.taxId ?? none],
    [es ? "Vence" : "Due", x.dueDate ?? none],
  ];
  const source =
    invoice.extraction?.source === "gemini"
      ? `Gemini · ${invoice.extraction.model}`
      : invoice.extraction?.source === "fallback"
        ? es
          ? "Extracción local: Gemini sin cuota o saturado en este momento"
          : "Local extraction: Gemini out of quota or overloaded right now"
        : es
          ? "Extracción local (sin GEMINI_API_KEY)"
          : "Local extraction (no GEMINI_API_KEY)";
  return (
    <div className="mt-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="typed break-words font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">{source}</p>
    </div>
  );
}

function AdminActions({
  invoice,
  status,
  es,
}: {
  invoice: AgentInvoice;
  status: DecisionStatus;
  es: boolean;
}) {
  const override = useAgentStore((s) => s.override);
  const act = (action: "approve" | "reject") => {
    const r = override(invoice.id, action);
    if (!r.ok) toast.error(es ? r.reason.es : r.reason.en);
  };
  if (status !== "HALTED_FOR_REVIEW" && status !== "SECURITY_BLOCKED") return null;
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {status === "SECURITY_BLOCKED" ? (
        <p className="flex items-start gap-2 text-sm font-semibold text-ink-red">
          <Lock className="mt-0.5 size-4 shrink-0" />
          {es
            ? "Aprobación bloqueada: la cuenta no coincide con la verificada en Blinka."
            : "Approval locked: the account does not match the one verified in Blinka."}
        </p>
      ) : (
        <Button onClick={() => act("approve")}>
          <Check />
          {es ? "Aprobar excepción" : "Approve override"}
        </Button>
      )}
      <Button variant="outline" onClick={() => act("reject")}>
        <X />
        {es ? "Rechazar" : "Reject"}
      </Button>
    </div>
  );
}

export function InvoiceDetail({ invoice, status, role, agent, es, lang }: DetailProps) {
  const allEvents = useAgentStore((s) => s.events);
  const events = useMemo(() => eventsFor(allEvents, invoice.id), [allEvents, invoice.id]);
  const decided = invoice.decision !== null;
  /** After an override the reason in force is the admin's, not the agent's original one. */
  const reason = currentDecisionEvent(events, invoice.id)?.message ?? invoice.decision?.reason;
  const tone = decisionStampTone(status);
  return (
    <article aria-label={invoice.title}>
      <p className="typed text-xs text-muted-foreground">
        {invoice.id} · {invoice.submittedBy}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">{invoice.title}</h2>
      {!decided && (
        <>
          {invoice.text && (
            <pre className="typed mt-4 max-h-56 overflow-auto whitespace-pre-wrap border-y border-dashed border-input py-3 text-[13px] leading-relaxed">
              {invoice.text}
            </pre>
          )}
          <Button
            className="mt-4"
            disabled={agent.running || !invoice.text}
            onClick={() => agent.run(invoice)}
          >
            <Play />
            {es ? "Ejecutar agente WinkWink" : "Run WinkWink agent"}
          </Button>
        </>
      )}
      <AgentRunSteps step={agent.step} running={agent.running} es={es} />
      {decided && invoice.decision && (
        <div className="mt-5">
          <Stamp key={`${invoice.id}-${status}`} tone={tone} es={es} size="lg" land />
          <p
            className={
              tone === "blocked"
                ? "mt-4 font-semibold leading-relaxed text-ink-red"
                : "mt-4 leading-relaxed"
            }
          >
            {reason && (es ? reason.es : reason.en)}
          </p>
          {status === "SECURITY_BLOCKED" && (
            <BankMismatch comparison={invoice.decision.bankComparison} es={es} />
          )}
          <ExtractedFields invoice={invoice} es={es} />
          {role === "admin" && status ? (
            <AdminActions invoice={invoice} status={status} es={es} />
          ) : (
            status === "HALTED_FOR_REVIEW" && (
              <p className="mt-5 text-sm text-muted-foreground">
                {es
                  ? "Solo un Admin financiero puede resolver esta factura."
                  : "Only a Finance admin can resolve this invoice."}
              </p>
            )
          )}
        </div>
      )}
      <AuditLog events={events} lang={lang} es={es} />
    </article>
  );
}

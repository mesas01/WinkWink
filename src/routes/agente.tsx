import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { FastForward, RotateCcw } from "lucide-react";
import { Logo, LangSwitch, ThemeToggle } from "@/components/blinka";
import { Button } from "@/components/ui/button";
import { RoleSwitch } from "@/components/agent/role-switch";
import { AgentKpis } from "@/components/agent/agent-kpis";
import { AgentQueue } from "@/components/agent/agent-queue";
import { InvoiceDetail } from "@/components/agent/invoice-detail";
import { NewInvoiceForm, type NewInvoicePayload } from "@/components/agent/new-invoice-form";
import { RulesPanel } from "@/components/agent/rules-panel";
import { VendorsPanel } from "@/components/agent/vendors-panel";
import { useAgentRun } from "@/hooks/use-agent-run";
import { agentStatus } from "@/services/agent.functions";
import { useApp } from "@/lib/store";
import { invoiceStatus, useAgentStore, type AgentInvoice } from "@/stores/agent-store";
import { ADMIN_NAME } from "@/domain/agent/samples";
import { currentDecisionEvent } from "@/domain/agent/audit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agente")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Agente WinkWink — Demo" },
      {
        name: "description",
        content:
          "Demo del agente WinkWink: extracción con Gemini, antifraude por cuenta verificada, reglas y registro de auditoría.",
      },
    ],
  }),
  component: AgentPage,
});

type Tab = "queue" | "new" | "rules" | "vendors";

const TABS: { id: Tab; es: string; en: string; admin?: boolean }[] = [
  { id: "queue", es: "Cola de facturas", en: "Invoice queue" },
  { id: "new", es: "Nueva factura", en: "New invoice" },
  { id: "rules", es: "Reglas activas", en: "Active rules", admin: true },
  { id: "vendors", es: "Proveedores verificados", en: "Verified vendors", admin: true },
];

function useGeminiStatus() {
  const fetchStatus = useServerFn(agentStatus);
  const [status, setStatus] = useState<{ gemini: boolean; model: string | null } | null>(null);
  useEffect(() => {
    fetchStatus()
      .then(setStatus)
      .catch(() => setStatus({ gemini: false, model: null }));
  }, [fetchStatus]);
  return status;
}

function GeminiBadge({ status, es }: { status: ReturnType<typeof useGeminiStatus>; es: boolean }) {
  if (!status) return null;
  return (
    <p className="typed text-xs text-muted-foreground">
      {status.gemini
        ? `Gemini · ${status.model}`
        : es
          ? "Sin GEMINI_API_KEY · extracción local de texto"
          : "No GEMINI_API_KEY · local text extraction"}
    </p>
  );
}

function AgentPage() {
  const lang = useApp((s) => s.lang);
  const es = lang === "es";
  const { role, employee, invoices, events, submitInvoice, reset } = useAgentStore();
  const [tab, setTab] = useState<Tab>("queue");
  const [selectedId, setSelectedId] = useState<string | null>(invoices[0]?.id ?? null);
  const agent = useAgentRun();
  const gemini = useGeminiStatus();

  const visible = useMemo(
    () => (role === "admin" ? invoices : invoices.filter((i) => i.submittedBy === employee)),
    [invoices, role, employee],
  );
  const statusOf = (id: string) => invoiceStatus(events, id);
  const selected = visible.find((i) => i.id === selectedId) ?? visible[0] ?? null;
  const activeTab = TABS.find((t) => t.id === tab && (!t.admin || role === "admin"))
    ? tab
    : "queue";

  const select = (id: string) => {
    setSelectedId(id);
    agent.reset();
  };

  async function submitNew(p: NewInvoicePayload) {
    const id = `INV-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const record: Omit<AgentInvoice, "createdAt" | "extraction" | "decision"> = {
      id,
      submittedBy: role === "admin" ? ADMIN_NAME : employee,
      title: p.title,
      text: p.text,
      fileName: p.file?.name ?? null,
    };
    submitInvoice(record);
    setSelectedId(id);
    setTab("queue");
    const invoice = useAgentStore.getState().invoices.find((i) => i.id === id);
    if (invoice)
      await agent.run(
        invoice,
        p.file ? { mimeType: p.file.mimeType, base64: p.file.base64 } : null,
      );
  }

  async function runAllPending() {
    for (const inv of useAgentStore.getState().invoices.filter((i) => !i.decision && i.text)) {
      setSelectedId(inv.id);
      await agent.run(inv);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b-2 border-rule">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Logo />
          <div className="flex flex-wrap items-center gap-2">
            <RoleSwitch es={es} />
            <LangSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">
              {role === "admin"
                ? es
                  ? "Agente de cuentas por pagar"
                  : "Accounts payable agent"
                : es
                  ? "Mis facturas"
                  : "My invoices"}
            </h1>
            <GeminiBadge status={gemini} es={es} />
          </div>
          {role === "admin" && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={runAllPending} disabled={agent.running}>
                <FastForward />
                {es ? "Evaluar pendientes" : "Evaluate pending"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  agent.reset();
                }}
              >
                <RotateCcw />
                {es ? "Reiniciar demo" : "Reset demo"}
              </Button>
            </div>
          )}
        </div>
        {role === "admin" && (
          <div className="mt-6">
            <AgentKpis
              statuses={invoices.map((i) => statusOf(i.id))}
              kinds={invoices.map((i) => currentDecisionEvent(events, i.id)?.kind ?? null)}
              es={es}
            />
          </div>
        )}
        <nav
          aria-label={es ? "Secciones del agente" : "Agent sections"}
          className="-mx-4 mt-6 flex gap-x-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0"
        >
          {TABS.filter((t) => !t.admin || role === "admin").map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={activeTab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
              className={cn(
                "press -mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-1 text-sm font-semibold",
                activeTab === t.id
                  ? "border-ink-violet text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {es ? t.es : t.en}
            </button>
          ))}
        </nav>
        <div className="mt-6">
          {activeTab === "queue" && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <AgentQueue
                invoices={visible}
                statusOf={statusOf}
                selectedId={selected?.id ?? null}
                onSelect={select}
                showSubmitter={role === "admin"}
                es={es}
              />
              <div className="lg:sticky lg:top-6 lg:self-start lg:border-l lg:border-input lg:pl-8">
                {selected ? (
                  <InvoiceDetail
                    invoice={selected}
                    status={statusOf(selected.id)}
                    role={role}
                    agent={agent}
                    es={es}
                    lang={lang}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {es ? "Selecciona una factura." : "Select an invoice."}
                  </p>
                )}
              </div>
            </div>
          )}
          {activeTab === "new" && (
            <NewInvoiceForm
              es={es}
              geminiReady={Boolean(gemini?.gemini)}
              onSubmit={submitNew}
              busy={agent.running}
            />
          )}
          {activeTab === "rules" && <RulesPanel es={es} />}
          {activeTab === "vendors" && <VendorsPanel es={es} />}
        </div>
      </main>
    </div>
  );
}

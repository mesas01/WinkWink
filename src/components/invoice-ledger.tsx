import { FileText, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stamp } from "@/components/stamp";
import { invoiceStampTone, type StampTone } from "@/lib/stamp";
import type { WorkspaceInvoice } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export type LedgerFilter = "all" | "approved" | "review" | "rejected" | "security";

const FILTERS: { id: LedgerFilter; tone?: StampTone; es: string; en: string }[] = [
  { id: "all", es: "Todas", en: "All" },
  { id: "approved", tone: "approved", es: "Aprobadas", en: "Approved" },
  { id: "review", tone: "held", es: "Retenidas", en: "Held" },
  { id: "rejected", tone: "rejected", es: "Rechazadas", en: "Rejected" },
  { id: "security", tone: "blocked", es: "Bloqueos de seguridad", en: "Security blocks" },
];

export function filterInvoices(invoices: WorkspaceInvoice[], filter: LedgerFilter) {
  if (filter === "all") return invoices;
  if (filter === "security") return invoices.filter((i) => i.security_status === "blocked");
  return invoices.filter((i) => i.status === filter && i.security_status !== "blocked");
}

const countFor = (invoices: WorkspaceInvoice[], filter: LedgerFilter) =>
  filterInvoices(invoices, filter).length;

interface FilterBarProps {
  invoices: WorkspaceInvoice[];
  filter: LedgerFilter;
  onFilter: (filter: LedgerFilter) => void;
  es: boolean;
}

export function LedgerFilters({ invoices, filter, onFilter, es }: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label={es ? "Filtrar facturas" : "Filter invoices"}
      className="flex flex-wrap gap-2"
    >
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          aria-pressed={filter === f.id}
          onClick={() => onFilter(f.id)}
          className={cn(
            "press inline-flex min-h-10 items-center gap-2 rounded-[3px] border px-3 text-sm font-semibold",
            filter === f.id
              ? "border-foreground bg-foreground text-background"
              : "border-input text-muted-foreground hover:border-foreground hover:text-foreground",
          )}
        >
          {es ? f.es : f.en}
          <span className="typed text-xs opacity-80">{countFor(invoices, f.id)}</span>
        </button>
      ))}
    </div>
  );
}

/** The agent's one-sentence reason, written in the row's margin. */
const reasonFor = (i: WorkspaceInvoice, es: boolean) =>
  i.error_message ||
  (es ? i.explanation_es : i.explanation_en) ||
  i.description ||
  (es ? "Sin decisión todavía" : "No decision yet");

const formatAmount = (i: WorkspaceInvoice, lang: string) =>
  i.amount === null
    ? "—"
    : `${i.currency || ""} ${i.amount.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface RowProps {
  invoice: WorkspaceInvoice;
  adminUi: boolean;
  es: boolean;
  lang: string;
  onOpen: (id: string) => void;
}

function LedgerRow({ invoice: i, adminUi, es, lang, onOpen }: RowProps) {
  const tone = invoiceStampTone(i);
  const missing = es ? "Sin identificar" : "Not identified";
  return (
    <li className="border-b border-dashed border-input last:border-b-0">
      <button
        type="button"
        onClick={() => onOpen(i.id)}
        className={cn(
          "group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-3 py-4 text-left transition-colors hover:bg-card sm:grid-cols-[minmax(0,1fr)_160px_150px]",
          tone === "blocked" && "bg-destructive-soft/50 hover:bg-destructive-soft",
        )}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 font-semibold">
            <span className="truncate">{i.vendor || i.file_name}</span>
            {i.security_status === "passed" && (
              <ShieldCheck
                aria-label={es ? "Cuenta verificada coincide" : "Verified account matches"}
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
          </span>
          <span className="typed mt-1 block truncate text-xs text-muted-foreground">
            {i.invoice_number || missing} · {i.invoice_date || missing}
            {adminUi && ` · ${i.profiles?.display_name || (es ? "Empleado" : "Employee")}`}
          </span>
          <span
            className={cn(
              "mt-1.5 line-clamp-2 text-sm",
              tone === "blocked" ? "font-semibold text-ink-red" : "text-muted-foreground",
            )}
          >
            {reasonFor(i, es)}
          </span>
        </span>
        <span className="typed text-right text-base font-bold">{formatAmount(i, lang)}</span>
        <span className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end">
          <Stamp tone={tone} es={es} />
        </span>
      </button>
    </li>
  );
}

interface LedgerProps {
  invoices: WorkspaceInvoice[];
  adminUi: boolean;
  es: boolean;
  lang: string;
  onOpen: (id: string) => void;
  onUpload: () => void;
}

export function InvoiceLedger({ invoices, adminUi, es, lang, onOpen, onUpload }: LedgerProps) {
  if (invoices.length === 0)
    return (
      <div className="mt-5 border-y-2 border-rule py-16 text-center">
        <FileText className="mx-auto size-9 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="mt-4 text-xl font-bold">
          {es ? "No hay facturas en esta vista" : "No invoices in this view"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {es
            ? "Sube una factura de prueba y el agente la sellará."
            : "Upload a test invoice and the agent will stamp it."}
        </p>
        <Button variant="outline" className="mt-6" onClick={onUpload}>
          <Upload />
          {es ? "Subir factura" : "Upload invoice"}
        </Button>
      </div>
    );
  return (
    <div className="mt-5 border-y-2 border-rule">
      <div
        aria-hidden
        className="hidden grid-cols-[minmax(0,1fr)_160px_150px] gap-x-6 border-b border-rule px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:grid"
      >
        <span>{es ? "Factura" : "Invoice"}</span>
        <span className="text-right">{es ? "Monto" : "Amount"}</span>
        <span className="text-right">{es ? "Decisión" : "Decision"}</span>
      </div>
      <ul>
        {invoices.map((i) => (
          <LedgerRow key={i.id} invoice={i} adminUi={adminUi} es={es} lang={lang} onOpen={onOpen} />
        ))}
      </ul>
    </div>
  );
}

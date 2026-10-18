import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentDecisionEvent, statusOfEvent } from "@/domain/agent/audit";
import {
  overrideDecision,
  type AgentRun,
  type OverrideAction,
  type OverrideResult,
} from "@/domain/agent/decide";
import { DEFAULT_RULES } from "@/domain/agent/rules";
import { ADMIN_NAME, EMPLOYEES, SAMPLE_INVOICES, type EmployeeName } from "@/domain/agent/samples";
import { makeEvent } from "@/domain/agent/audit";
import { VERIFIED_VENDORS } from "@/domain/agent/vendors";
import type {
  AuditEvent,
  Decision,
  DecisionStatus,
  ExtractionResult,
  PaymentRule,
  VerifiedVendor,
} from "@/domain/agent/types";

/** Demo-only roles. Real authorization lives server-side; this state only shapes the demo UI. */
export type AgentRole = "employee" | "admin";

export interface AgentInvoice {
  id: string;
  submittedBy: string;
  title: string;
  text: string | null;
  fileName: string | null;
  createdAt: string;
  extraction: ExtractionResult | null;
  decision: Decision | null;
}

interface AgentState {
  role: AgentRole;
  employee: EmployeeName;
  invoices: AgentInvoice[];
  events: AuditEvent[];
  rules: PaymentRule[];
  vendors: VerifiedVendor[];
  setRole: (role: AgentRole) => void;
  setEmployee: (employee: EmployeeName) => void;
  submitInvoice: (invoice: Omit<AgentInvoice, "createdAt" | "extraction" | "decision">) => void;
  recordRun: (invoiceId: string, extraction: ExtractionResult, run: AgentRun) => void;
  override: (invoiceId: string, action: OverrideAction) => OverrideResult;
  toggleRule: (ruleId: string) => void;
  reset: () => void;
}

/** Uploaded files are named after what the agent read, not after the file name. */
function titleFor(invoice: AgentInvoice, extraction: ExtractionResult): string {
  const { vendor, invoiceNumber } = extraction.invoice;
  if (!invoice.fileName || !vendor) return invoice.title;
  return invoiceNumber ? `${vendor} · ${invoiceNumber}` : vendor;
}

const seedInvoices = (): AgentInvoice[] =>
  SAMPLE_INVOICES.map((s, i) => ({
    id: s.id,
    submittedBy: s.submittedBy,
    title: s.title,
    text: s.text,
    fileName: null,
    createdAt: new Date(Date.UTC(2026, 9, 12 + i, 14)).toISOString(),
    extraction: null,
    decision: null,
  }));

const seedEvents = (invoices: AgentInvoice[]): AuditEvent[] =>
  invoices.map((inv) =>
    makeEvent(
      inv.id,
      "submitted",
      "employee",
      {
        es: `Factura enviada por ${inv.submittedBy}.`,
        en: `Invoice submitted by ${inv.submittedBy}.`,
      },
      null,
      new Date(inv.createdAt),
    ),
  );

const initial = () => {
  const invoices = seedInvoices();
  return {
    role: "admin" as AgentRole,
    employee: EMPLOYEES[0] as EmployeeName,
    invoices,
    events: seedEvents(invoices),
    rules: DEFAULT_RULES,
    vendors: VERIFIED_VENDORS,
  };
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      ...initial(),
      setRole: (role) => set({ role }),
      setEmployee: (employee) => set({ employee }),
      submitInvoice: (invoice) => {
        const createdAt = new Date().toISOString();
        const submitted = makeEvent(invoice.id, "submitted", "employee", {
          es: `Factura enviada por ${invoice.submittedBy}.`,
          en: `Invoice submitted by ${invoice.submittedBy}.`,
        });
        set((s) => ({
          invoices: [{ ...invoice, createdAt, extraction: null, decision: null }, ...s.invoices],
          events: [...s.events, submitted],
        }));
      },
      recordRun: (invoiceId, extraction, run) =>
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? { ...i, title: titleFor(i, extraction), extraction, decision: run.decision }
              : i,
          ),
          events: [
            ...s.events.filter((e) => e.invoiceId !== invoiceId || e.kind === "submitted"),
            ...run.events,
          ],
        })),
      override: (invoiceId, action) => {
        const result = overrideDecision(invoiceId, get().events, action, ADMIN_NAME);
        if (result.ok) set((s) => ({ events: [...s.events, result.event] }));
        return result;
      },
      toggleRule: (ruleId) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
        })),
      reset: () => set(initial()),
    }),
    { name: "winkwink-agent-demo", version: 1 },
  ),
);

/** Status in force: the latest decision event that no override replaced. */
export function invoiceStatus(events: AuditEvent[], invoiceId: string): DecisionStatus | null {
  const current = currentDecisionEvent(events, invoiceId);
  return current ? statusOfEvent(current) : null;
}

import { checkVendorAccount } from "./antifraud";
import { currentDecisionEvent, makeEvent, statusOfEvent } from "./audit";
import { categoryLabel, evaluateRules } from "./rules";
import type {
  AuditEvent,
  Decision,
  ExtractionResult,
  ExtractedInvoice,
  Localized,
  PaymentRule,
  VerifiedVendor,
} from "./types";

export interface AgentRun {
  decision: Decision;
  events: AuditEvent[];
}

const missingFields = (i: ExtractedInvoice): string[] =>
  [
    i.vendor ? null : "vendor",
    i.amount === null ? "amount" : null,
    i.currency ? null : "currency",
  ].filter((f): f is string => f !== null);

function extractionMessage(r: ExtractionResult): Localized {
  const i = r.invoice;
  const via =
    r.source === "gemini"
      ? `Gemini (${r.model})`
      : r.source === "fallback"
        ? "extracción local (Gemini sin cuota o saturado)"
        : "extracción local";
  const viaEn =
    r.source === "gemini"
      ? `Gemini (${r.model})`
      : r.source === "fallback"
        ? "local extraction (Gemini out of quota or overloaded)"
        : "local extraction";
  const summary = `${i.vendor ?? "?"} · ${i.currency ?? "?"} ${i.amount ?? "?"} · ${i.invoiceBankAccount ?? "—"}`;
  return {
    es: `Datos extraídos con ${via}: ${summary} · ${categoryLabel(i.category, true)}.`,
    en: `Fields extracted with ${viaEn}: ${summary} · ${categoryLabel(i.category, false)}.`,
  };
}

const decision = (
  status: Decision["status"],
  reason: Localized,
  extra: Partial<Decision> = {},
): Decision => ({ status, reason, bankComparison: null, ruleId: null, ...extra });

/**
 * Steps B–D. Deterministic: the AI only extracts fields; this function decides.
 * Fails closed: missing data, unknown vendors and unverifiable accounts are held for a human.
 */
export function runAgentDecision(
  invoiceId: string,
  extraction: ExtractionResult,
  vendors: VerifiedVendor[],
  rules: PaymentRule[],
): AgentRun {
  const inv = extraction.invoice;
  const events: AuditEvent[] = [
    makeEvent(invoiceId, "extracted", "agent", extractionMessage(extraction)),
  ];
  const missing = missingFields(inv);
  if (missing.length > 0) {
    const reason = {
      es: `Pago detenido: faltan datos en la factura (${missing.join(", ")}). Revisión humana necesaria.`,
      en: `Payment halted: the invoice is missing data (${missing.join(", ")}). Human review required.`,
    };
    events.push(makeEvent(invoiceId, "incomplete", "agent", reason));
    return { decision: decision("HALTED_FOR_REVIEW", reason), events };
  }
  const fraud = checkVendorAccount(inv, vendors);
  if (fraud.kind === "blocked") {
    events.push(makeEvent(invoiceId, "security_blocked", "agent", fraud.message));
    return {
      decision: decision("SECURITY_BLOCKED", fraud.message, { bankComparison: fraud.comparison }),
      events,
    };
  }
  if (fraud.kind !== "passed") {
    events.push(makeEvent(invoiceId, "unknown_vendor", "agent", fraud.message));
    return { decision: decision("HALTED_FOR_REVIEW", fraud.message), events };
  }
  events.push(makeEvent(invoiceId, "security_passed", "agent", fraud.message));
  const outcome = evaluateRules(inv, rules);
  const kind =
    outcome.action === "approve"
      ? "rule_approved"
      : outcome.action === "review"
        ? "rule_halted"
        : "no_rule";
  events.push(makeEvent(invoiceId, kind, "agent", outcome.message));
  const status = outcome.action === "approve" ? "APPROVED" : "HALTED_FOR_REVIEW";
  return {
    decision: decision(status, outcome.message, { ruleId: outcome.rule?.id ?? null }),
    events,
  };
}

export type OverrideAction = "approve" | "reject";

export type OverrideResult = { ok: true; event: AuditEvent } | { ok: false; reason: Localized };

/** A finance admin replaces the decision in force. Security blocks can be rejected, never approved. */
export function overrideDecision(
  invoiceId: string,
  events: AuditEvent[],
  action: OverrideAction,
  adminName: string,
): OverrideResult {
  const current = currentDecisionEvent(events, invoiceId);
  if (!current)
    return {
      ok: false,
      reason: { es: "La factura aún no tiene decisión.", en: "The invoice has no decision yet." },
    };
  if (action === "approve" && statusOfEvent(current) === "SECURITY_BLOCKED")
    return {
      ok: false,
      reason: {
        es: "Una factura bloqueada por seguridad no se puede aprobar: la cuenta no coincide con la verificada en Blinka.",
        en: "A security-blocked invoice cannot be approved: the account does not match the one verified in Blinka.",
      },
    };
  const message =
    action === "approve"
      ? {
          es: `Excepción aprobada manualmente por ${adminName} (Admin financiero).`,
          en: `Override approved manually by ${adminName} (Finance admin).`,
        }
      : {
          es: `Factura rechazada por ${adminName} (Admin financiero).`,
          en: `Invoice rejected by ${adminName} (Finance admin).`,
        };
  const kind = action === "approve" ? "override_approved" : "override_rejected";
  return { ok: true, event: makeEvent(invoiceId, kind, "admin", message, current.id) };
}

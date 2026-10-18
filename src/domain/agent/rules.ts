import type { ExtractedInvoice, InvoiceCategory, Localized, PaymentRule } from "./types";

/** Default company policy for the demo. Admins can toggle each rule. */
export const DEFAULT_RULES: PaymentRule[] = [
  {
    id: "software-under-500",
    category: "software",
    comparison: "under",
    threshold: 500,
    currency: "USD",
    action: "approve",
    enabled: true,
  },
  {
    id: "travel-over-100",
    category: "travel",
    comparison: "over",
    threshold: 100,
    currency: "USD",
    action: "review",
    enabled: true,
  },
  {
    id: "travel-under-100",
    category: "travel",
    comparison: "under",
    threshold: 100,
    currency: "USD",
    action: "approve",
    enabled: true,
  },
];

const CATEGORY_LABEL: Record<InvoiceCategory, Localized> = {
  software: { es: "Software/SaaS", en: "Software/SaaS" },
  travel: { es: "Viáticos", en: "Travel" },
  marketing: { es: "Marketing", en: "Marketing" },
  services: { es: "Servicios", en: "Services" },
  other: { es: "Otra", en: "Other" },
};

export const categoryLabel = (c: InvoiceCategory, es: boolean): string =>
  es ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en;

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ruleLabel(rule: PaymentRule, es: boolean): string {
  const cat = categoryLabel(rule.category, es);
  const limit = money(rule.threshold, rule.currency);
  const cmp = rule.comparison === "under" ? (es ? "menor a" : "under") : es ? "mayor a" : "over";
  const act =
    rule.action === "approve"
      ? es
        ? "Aprobar automáticamente"
        : "Auto-approve"
      : es
        ? "Retener para revisión humana"
        : "Hold for human review";
  return `${act}: ${cat} ${cmp} ${limit}`;
}

function matches(rule: PaymentRule, invoice: ExtractedInvoice): boolean {
  if (!rule.enabled || invoice.amount === null) return false;
  if (rule.category !== invoice.category) return false;
  if ((invoice.currency ?? "").toUpperCase() !== rule.currency.toUpperCase()) return false;
  return rule.comparison === "under"
    ? invoice.amount < rule.threshold
    : invoice.amount > rule.threshold;
}

export interface RuleOutcome {
  action: "approve" | "review" | "none";
  rule: PaymentRule | null;
  message: Localized;
}

/** Step C. Review rules outrank approval rules; no matching rule fails closed to review. */
export function evaluateRules(invoice: ExtractedInvoice, rules: PaymentRule[]): RuleOutcome {
  const hits = rules.filter((r) => matches(r, invoice));
  const review = hits.find((r) => r.action === "review");
  const approve = hits.find((r) => r.action === "approve");
  const amount = money(invoice.amount ?? 0, invoice.currency ?? "");
  if (review)
    return {
      action: "review",
      rule: review,
      message: {
        es: `Pago detenido: ${amount} activa la regla "${ruleLabel(review, true)}".`,
        en: `Payment halted: ${amount} triggers the rule "${ruleLabel(review, false)}".`,
      },
    };
  if (approve)
    return {
      action: "approve",
      rule: approve,
      message: {
        es: `Aprobada automáticamente: ${amount} cumple la regla "${ruleLabel(approve, true)}".`,
        en: `Approved automatically: ${amount} meets the rule "${ruleLabel(approve, false)}".`,
      },
    };
  return {
    action: "none",
    rule: null,
    message: {
      es: `Pago detenido: ninguna regla activa autoriza ${amount} en ${categoryLabel(invoice.category, true)}.`,
      en: `Payment halted: no active rule authorizes ${amount} in ${categoryLabel(invoice.category, false)}.`,
    },
  };
}

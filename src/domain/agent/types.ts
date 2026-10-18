/** Bilingual text. Spanish is the default language of the product. */
export interface Localized {
  es: string;
  en: string;
}

export type InvoiceCategory = "software" | "travel" | "marketing" | "services" | "other";

export const INVOICE_CATEGORIES: readonly InvoiceCategory[] = [
  "software",
  "travel",
  "marketing",
  "services",
  "other",
];

/** Fields the extraction step must return. Missing values stay null, never guessed. */
export interface ExtractedInvoice {
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  category: InvoiceCategory;
  invoiceBankAccount: string | null;
  taxId: string | null;
  invoiceNumber: string | null;
  dueDate: string | null;
}

export type ExtractionSource = "gemini" | "offline";

export interface ExtractionResult {
  invoice: ExtractedInvoice;
  source: ExtractionSource;
  model: string | null;
}

export interface VerifiedVendor {
  id: string;
  name: string;
  aliases: string[];
  bankAccount: string;
  taxId: string;
}

export type RuleComparison = "under" | "over";
export type RuleAction = "approve" | "review";

export interface PaymentRule {
  id: string;
  category: InvoiceCategory;
  comparison: RuleComparison;
  threshold: number;
  currency: string;
  action: RuleAction;
  enabled: boolean;
}

/** Final state of an invoice. The agent never moves money: APPROVED is a decision, not a payment. */
export type DecisionStatus = "APPROVED" | "HALTED_FOR_REVIEW" | "SECURITY_BLOCKED" | "REJECTED";

export type AuditKind =
  | "submitted"
  | "extracted"
  | "security_passed"
  | "security_blocked"
  | "unknown_vendor"
  | "rule_approved"
  | "rule_halted"
  | "no_rule"
  | "incomplete"
  | "override_approved"
  | "override_rejected";

export type AuditActor = "agent" | "admin" | "employee";

export interface AuditEvent {
  id: string;
  invoiceId: string;
  kind: AuditKind;
  actor: AuditActor;
  at: string;
  message: Localized;
  /** Id of the earlier decision event this one replaces. The replaced event is shown struck through. */
  supersedes: string | null;
}

export interface BankComparison {
  invoiceAccount: string;
  verifiedAccount: string;
}

export interface Decision {
  status: DecisionStatus;
  reason: Localized;
  bankComparison: BankComparison | null;
  ruleId: string | null;
}

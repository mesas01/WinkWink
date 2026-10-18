export type StampTone = "approved" | "held" | "blocked" | "rejected" | "pending" | "error";

export interface StampLabel {
  es: string;
  en: string;
}

const LABELS: Record<StampTone, StampLabel> = {
  approved: { es: "Aprobada", en: "Approved" },
  held: { es: "Retenida", en: "Held" },
  blocked: { es: "Bloqueada", en: "Blocked" },
  rejected: { es: "Rechazada", en: "Rejected" },
  pending: { es: "Pendiente", en: "Pending" },
  error: { es: "Error", en: "Error" },
};

export const stampLabel = (tone: StampTone, es: boolean): string =>
  es ? LABELS[tone].es : LABELS[tone].en;

interface InvoiceStampInput {
  status: string;
  security_status?: string | null;
}

/** Maps a persisted invoice decision to the stamp it carries. Security outranks status. */
export function invoiceStampTone(invoice: InvoiceStampInput): StampTone {
  if (invoice.security_status === "blocked") return "blocked";
  switch (invoice.status) {
    case "approved":
      return "approved";
    case "review":
      return "held";
    case "rejected":
      return "rejected";
    case "error":
      return "error";
    default:
      return "pending";
  }
}

/** Maps an agent decision status to its stamp. No decision yet stamps as pending. */
export function decisionStampTone(status: string | null): StampTone {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "HALTED_FOR_REVIEW":
      return "held";
    case "SECURITY_BLOCKED":
      return "blocked";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}

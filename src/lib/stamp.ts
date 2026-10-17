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

const TILTS: Record<StampTone, string> = {
  approved: "-3deg",
  held: "2deg",
  blocked: "-4deg",
  rejected: "3deg",
  pending: "0deg",
  error: "0deg",
};

export const stampLabel = (tone: StampTone, es: boolean): string =>
  es ? LABELS[tone].es : LABELS[tone].en;

export const stampTilt = (tone: StampTone): string => TILTS[tone];

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

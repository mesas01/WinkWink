import type { Json } from "@/integrations/supabase/types";

export interface BankComparison {
  invoiceAccount: string;
  verifiedAccount: string;
}

const text = (v: Json | undefined): string | null => (typeof v === "string" && v.trim() ? v : null);

/**
 * Reads the bank-account comparison the anti-fraud check stores in `security_snapshot`
 * (`invoiceAccount` vs `verifiedAccount`). Returns null when the snapshot carries none,
 * so the UI never invents account numbers.
 */
export function readBankComparison(snapshot: Json | null | undefined): BankComparison | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const invoiceAccount = text(snapshot["invoiceAccount"]);
  const verifiedAccount = text(snapshot["verifiedAccount"]);
  return invoiceAccount && verifiedAccount ? { invoiceAccount, verifiedAccount } : null;
}

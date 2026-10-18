import { sameBankAccount } from "./bank";
import { findVerifiedVendor } from "./vendors";
import type { BankComparison, ExtractedInvoice, Localized, VerifiedVendor } from "./types";

export type AntifraudResult =
  | { kind: "passed"; vendor: VerifiedVendor; message: Localized }
  | { kind: "blocked"; vendor: VerifiedVendor; comparison: BankComparison; message: Localized }
  | { kind: "unverifiable"; vendor: VerifiedVendor; message: Localized }
  | { kind: "unknown_vendor"; message: Localized };

const blockedMessage = (vendor: VerifiedVendor, invoiceAccount: string): Localized => ({
  es: `ALERTA DE SEGURIDAD: la cuenta bancaria de la factura (${invoiceAccount}) no coincide con la cuenta pre-verificada de ${vendor.name} en Blinka (${vendor.bankAccount}). Pago bloqueado para prevenir fraude.`,
  en: `SECURITY ALERT: Bank account on invoice (${invoiceAccount}) does not match ${vendor.name}'s pre-verified account in Blinka (${vendor.bankAccount}). Payment blocked to prevent fraud.`,
});

const taxIdMessage = (vendor: VerifiedVendor, taxId: string): Localized => ({
  es: `ALERTA DE SEGURIDAD: el NIT/Tax ID de la factura (${taxId}) no coincide con el verificado de ${vendor.name} (${vendor.taxId}). Pago bloqueado para prevenir fraude.`,
  en: `SECURITY ALERT: Tax ID on invoice (${taxId}) does not match ${vendor.name}'s verified Tax ID (${vendor.taxId}). Payment blocked to prevent fraud.`,
});

/** Step B. Compares the invoice's bank account (and tax ID when present) against the verified vendor. */
export function checkVendorAccount(
  invoice: ExtractedInvoice,
  vendors: VerifiedVendor[],
): AntifraudResult {
  const vendor = findVerifiedVendor(invoice.vendor, vendors);
  if (!vendor)
    return {
      kind: "unknown_vendor",
      message: {
        es: `"${invoice.vendor ?? "Proveedor sin identificar"}" no está en la lista de proveedores verificados de Blinka.`,
        en: `"${invoice.vendor ?? "Unidentified vendor"}" is not on Blinka's verified vendor list.`,
      },
    };
  if (!invoice.invoiceBankAccount)
    return {
      kind: "unverifiable",
      vendor,
      message: {
        es: `La factura de ${vendor.name} no trae cuenta bancaria; no se puede verificar contra Blinka.`,
        en: `The ${vendor.name} invoice has no bank account, so it cannot be checked against Blinka.`,
      },
    };
  const comparison = {
    invoiceAccount: invoice.invoiceBankAccount,
    verifiedAccount: vendor.bankAccount,
  };
  if (!sameBankAccount(invoice.invoiceBankAccount, vendor.bankAccount))
    return {
      kind: "blocked",
      vendor,
      comparison,
      message: blockedMessage(vendor, invoice.invoiceBankAccount),
    };
  if (invoice.taxId && invoice.taxId.trim().toUpperCase() !== vendor.taxId.toUpperCase())
    return { kind: "blocked", vendor, comparison, message: taxIdMessage(vendor, invoice.taxId) };
  return {
    kind: "passed",
    vendor,
    message: {
      es: `Cuenta ${vendor.bankAccount} coincide con la verificada de ${vendor.name} en Blinka.`,
      en: `Account ${vendor.bankAccount} matches ${vendor.name}'s verified account in Blinka.`,
    },
  };
}

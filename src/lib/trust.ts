import { normalizeMerchant } from "./merchants";
export type SupplierReference = {
  id: string;
  name: string;
  tax_id: string | null;
  invoice_prefix: string | null;
  reference_invoice_number: string | null;
  expected_category: string | null;
  expected_currency: string | null;
  trust_confirmed_at: string | null;
  trust_confirmed_by: string | null;
  bank_name?: string | null;
  bank_last4?: string | null;
};
export function checkSupplierReference(
  invoice: {
    taxId: string | null;
    invoiceNumber: string | null;
    category: string | null;
    currency: string | null;
    bankName?: string | null;
    bankLast4?: string | null;
  },
  supplier: SupplierReference | undefined,
) {
  const normalizeTax = (v: string) => normalizeMerchant(v).replace(/[\s-]/g, "");
  if (!supplier?.trust_confirmed_at || !supplier.trust_confirmed_by)
    return { passed: false, reason: "supplier_not_confirmed" };
  if (
    !invoice.taxId ||
    !supplier.tax_id ||
    normalizeTax(invoice.taxId) !== normalizeTax(supplier.tax_id)
  )
    return { passed: false, reason: "tax_reference_mismatch" };
  if (
    !supplier.invoice_prefix ||
    !invoice.invoiceNumber?.toUpperCase().startsWith(supplier.invoice_prefix.toUpperCase())
  )
    return { passed: false, reason: "invoice_format_mismatch" };
  if (
    invoice.category !== supplier.expected_category ||
    invoice.currency !== supplier.expected_currency
  )
    return { passed: false, reason: "agreement_mismatch" };
  if (
    supplier.bank_name &&
    (!invoice.bankName ||
      normalizeMerchant(invoice.bankName) !== normalizeMerchant(supplier.bank_name))
  )
    return { passed: false, reason: "bank_reference_mismatch" };
  if (supplier.bank_last4 && invoice.bankLast4 !== supplier.bank_last4)
    return { passed: false, reason: "bank_reference_mismatch" };
  return { passed: true, reason: "supplier_reference_matches" };
}
export function validInvoiceDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function completeInvoiceReference(invoice: {
  isInvoice: boolean;
  uncertain: boolean;
  vendor: string | null;
  invoiceNumber: string | null;
  description: string | null;
  amount: number | null;
  category: string | null;
  currency: string | null;
  date: string | null;
  dueDate: string | null;
}) {
  return (
    invoice.isInvoice &&
    !invoice.uncertain &&
    Boolean(
      invoice.vendor?.trim() &&
      invoice.invoiceNumber?.trim() &&
      invoice.description?.trim() &&
      invoice.category &&
      invoice.currency,
    ) &&
    invoice.amount !== null &&
    Number.isFinite(invoice.amount) &&
    invoice.amount >= 0 &&
    validInvoiceDate(invoice.date) &&
    validInvoiceDate(invoice.dueDate)
  );
}

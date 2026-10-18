import { INVOICE_CATEGORIES, type ExtractedInvoice, type InvoiceCategory } from "./types";

/**
 * Deterministic fallback used only when GEMINI_API_KEY is not configured.
 * Reads labelled lines ("Proveedor: AWS", "Cuenta: Chase ****4321") from plain-text invoices.
 * The UI labels results from this path as "extracción local", never as AI.
 */
const FIELDS: Record<keyof Omit<ExtractedInvoice, "category" | "amount">, RegExp> = {
  vendor: /^(?:proveedor|vendor|from|de)\s*:\s*(.+)$/im,
  currency: /^(?:moneda|currency)\s*:\s*([A-Z]{3,4})\s*$/im,
  invoiceBankAccount: /^(?:cuenta(?: bancaria)?|bank(?: account)?|pagar a|pay to)\s*:\s*(.+)$/im,
  taxId: /^(?:nit|tax id|cnpj|rut)\s*:\s*(.+)$/im,
  invoiceNumber: /^(?:factura|invoice)(?: n[o°º.]*| #| number)?\s*:\s*(.+)$/im,
  dueDate: /^(?:vence|vencimiento|due(?: date)?)\s*:\s*(\d{4}-\d{2}-\d{2})\s*$/im,
};

const AMOUNT = /^(?:total|monto|amount)\s*:\s*(?:[A-Z]{3}\s*)?\$?\s*([\d.,]+)/im;
const CATEGORY = /^(?:categor[ií]a|category)\s*:\s*(.+)$/im;

const CATEGORY_WORDS: Record<string, InvoiceCategory> = {
  software: "software",
  saas: "software",
  viaticos: "travel",
  viáticos: "travel",
  travel: "travel",
  marketing: "marketing",
  servicios: "services",
  services: "services",
};

const pick = (text: string, re: RegExp): string | null => re.exec(text)?.[1]?.trim() || null;

function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const normalized =
    raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseCategory(raw: string | null): InvoiceCategory {
  const word = raw?.toLowerCase().split(/[\s/]+/)[0] ?? "";
  const mapped = CATEGORY_WORDS[word];
  return mapped && INVOICE_CATEGORIES.includes(mapped) ? mapped : "other";
}

export function extractOffline(text: string): ExtractedInvoice {
  return {
    vendor: pick(text, FIELDS.vendor),
    amount: parseAmount(pick(text, AMOUNT)),
    currency: pick(text, FIELDS.currency)?.toUpperCase() ?? null,
    category: parseCategory(pick(text, CATEGORY)),
    invoiceBankAccount: pick(text, FIELDS.invoiceBankAccount),
    taxId: pick(text, FIELDS.taxId),
    invoiceNumber: pick(text, FIELDS.invoiceNumber),
    dueDate: pick(text, FIELDS.dueDate),
  };
}

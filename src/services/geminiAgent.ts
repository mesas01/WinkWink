import { z } from "zod";
import {
  INVOICE_CATEGORIES,
  type ExtractedInvoice,
  type ExtractionResult,
} from "@/domain/agent/types";
import { extractOffline } from "@/domain/agent/offline-extract";

/**
 * Step A (OCR & extraction) with Google Gemini over the REST API.
 * Server-only: reads GEMINI_API_KEY from the environment and never ships it to the browser.
 * The model only extracts fields. It never decides; the deterministic engine does.
 */
const DEFAULT_MODEL = "gemini-3.8-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export interface InvoiceInput {
  text: string | null;
  file: { mimeType: string; base64: string } | null;
}

const extractionSchema = z.object({
  vendor: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  category: z.enum(INVOICE_CATEGORIES as [string, ...string[]]),
  invoice_bank_account: z.string().nullable(),
  tax_id: z.string().nullable(),
  invoice_number: z.string().nullable(),
  due_date: z.string().nullable(),
});

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    vendor: { type: "STRING", nullable: true },
    amount: { type: "NUMBER", nullable: true },
    currency: { type: "STRING", nullable: true, description: "ISO 4217 code, e.g. USD, COP, BRL" },
    category: { type: "STRING", enum: [...INVOICE_CATEGORIES] },
    invoice_bank_account: {
      type: "STRING",
      nullable: true,
      description:
        "Bank name plus masked last four digits exactly as printed, e.g. 'Chase ****4321'",
    },
    tax_id: { type: "STRING", nullable: true },
    invoice_number: { type: "STRING", nullable: true },
    due_date: { type: "STRING", nullable: true, description: "YYYY-MM-DD" },
  },
  required: [
    "vendor",
    "amount",
    "currency",
    "category",
    "invoice_bank_account",
    "tax_id",
    "invoice_number",
    "due_date",
  ],
};

const PROMPT = [
  "You are the extraction step of an accounts-payable agent.",
  "Read the invoice and return STRICT JSON matching the schema.",
  "Use null for any field that is not printed on the invoice. Never guess or infer missing values.",
  "category must be one of: software, travel, marketing, services, other.",
  "invoice_bank_account is the account the invoice asks to be paid to, copied as printed.",
].join(" ");

export const geminiModel = (): string => process.env["GEMINI_MODEL"]?.trim() || DEFAULT_MODEL;
export const geminiConfigured = (): boolean => Boolean(process.env["GEMINI_API_KEY"]?.trim());

function requestBody(input: InvoiceInput) {
  const parts: Record<string, unknown>[] = [{ text: PROMPT }];
  if (input.text) parts.push({ text: `INVOICE:\n${input.text}` });
  if (input.file)
    parts.push({ inlineData: { mimeType: input.file.mimeType, data: input.file.base64 } });
  return {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

function toExtracted(raw: z.infer<typeof extractionSchema>): ExtractedInvoice {
  return {
    vendor: raw.vendor,
    amount: raw.amount,
    currency: raw.currency?.toUpperCase() ?? null,
    category: raw.category as ExtractedInvoice["category"],
    invoiceBankAccount: raw.invoice_bank_account,
    taxId: raw.tax_id,
    invoiceNumber: raw.invoice_number,
    dueDate: raw.due_date,
  };
}

/** Rate limits and overload are transient on Gemini: retry them with exponential backoff. */
const RETRYABLE = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [800, 1600, 3200, 6400];

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let res = await fetch(url, init);
  for (const delay of RETRY_DELAYS_MS) {
    if (!RETRYABLE.has(res.status)) return res;
    await new Promise((r) => setTimeout(r, delay));
    res = await fetch(url, init);
  }
  return res;
}

async function callGemini(
  input: InvoiceInput,
  apiKey: string,
  model: string,
): Promise<ExtractedInvoice> {
  const res = await fetchWithRetry(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(requestBody(input)),
  });
  if (!res.ok)
    throw new Error(`Gemini ${model} respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini no devolvió contenido.");
  return toExtracted(extractionSchema.parse(JSON.parse(text)));
}

/** Extracts invoice fields with Gemini, or with the labelled local parser when no key is configured. */
export async function extractInvoice(input: InvoiceInput): Promise<ExtractionResult> {
  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) {
    if (!input.text)
      throw new Error("Sin GEMINI_API_KEY solo se pueden evaluar facturas en texto.");
    return { invoice: extractOffline(input.text), source: "offline", model: null };
  }
  const model = geminiModel();
  return { invoice: await callGemini(input, apiKey, model), source: "gemini", model };
}

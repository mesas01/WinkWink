import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Vercel functions accept ~4.5 MB request bodies; base64 adds a third, so files stay under 3 MB. */
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;

const inputSchema = z
  .object({
    text: z.string().trim().min(1).max(20_000).nullable(),
    file: z
      .object({
        mimeType: z.enum(FILE_TYPES),
        base64: z.string().max(Math.ceil((MAX_FILE_BYTES * 4) / 3)),
      })
      .nullable(),
    accessCode: z.string().max(200).nullable().optional(),
  })
  .refine((v) => v.text !== null || v.file !== null, "Invoice text or file required");

/** Step A on the server: Gemini extraction. The browser never sees the API key. */
export const extractInvoiceFields = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { extractInvoice, geminiConfigured } = await import("./geminiAgent");
    if (geminiConfigured()) {
      const { guardExtraction } = await import("./agent-guard.server");
      const guard = guardExtraction(data.accessCode ?? null);
      if (!guard.ok) return { ok: false as const, reason: guard.reason, message: guard.message };
    }
    try {
      return { ok: true as const, result: await extractInvoice(data) };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Extraction failed",
      };
    }
  });

/** Lets the UI say whether extraction runs on Gemini or on the local fallback. */
export const agentStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { geminiConfigured, geminiModel } = await import("./geminiAgent");
  const { accessCodeRequired } = await import("./agent-guard.server");
  return {
    gemini: geminiConfigured(),
    model: geminiConfigured() ? geminiModel() : null,
    accessCodeRequired: geminiConfigured() && accessCodeRequired(),
  };
});

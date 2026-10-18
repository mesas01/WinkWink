import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractPdfText } from "@/services/pdf-text.server";
import { extractOffline } from "@/domain/agent/offline-extract";
import { runAgentDecision } from "@/domain/agent/decide";
import { DEFAULT_RULES } from "@/domain/agent/rules";
import { VERIFIED_VENDORS } from "@/domain/agent/vendors";

const decide = (file: string) => {
  const base64 = readFileSync(resolve(process.cwd(), "test-invoices", file)).toString("base64");
  const invoice = extractOffline(extractPdfText(base64));
  return {
    invoice,
    status: runAgentDecision(
      "T",
      { invoice, source: "offline", model: null },
      VERIFIED_VENDORS,
      DEFAULT_RULES,
    ).decision.status,
  };
};

describe("test invoice PDFs decide as labelled without Gemini", () => {
  it.each([
    ["01-aws-aprobada.pdf", "APPROVED"],
    ["02-aws-fraude-cuenta-cambiada.pdf", "SECURITY_BLOCKED"],
    ["03-figma-fraude-taxid.pdf", "SECURITY_BLOCKED"],
    ["04-uber-viaticos-retenida.pdf", "HALTED_FOR_REVIEW"],
    ["05-uber-taxi-aprobada.pdf", "APPROVED"],
    ["06-slack-aprobada.pdf", "APPROVED"],
    ["07-proveedor-desconocido-retenida.pdf", "HALTED_FOR_REVIEW"],
    ["08-rappi-brl-sin-regla.pdf", "HALTED_FOR_REVIEW"],
  ])("%s → %s", (file, expected) => {
    expect(decide(file).status).toBe(expected);
  });

  it("reads the fields of the forged AWS invoice", () => {
    expect(decide("02-aws-fraude-cuenta-cambiada.pdf").invoice).toMatchObject({
      vendor: "AWS",
      amount: 169,
      currency: "USD",
      category: "software",
      invoiceBankAccount: "Wells Fargo ****9999",
      taxId: "US-998822",
    });
  });
});

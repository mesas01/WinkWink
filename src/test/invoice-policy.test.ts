import { describe, it, expect } from "vitest";
import {
  decideInvoice,
  validateUpload,
  REAL_UPLOADS_ENABLED,
  extractionSchema,
  type PaymentRule,
  type ExtractedInvoice,
} from "@/lib/invoice-policy";
const invoice: ExtractedInvoice = {
  isInvoice: true,
  vendor: "AWS",
  invoiceNumber: "AWS-00150",
  category: "software",
  amount: 150,
  currency: "USD",
  date: "2026-10-17",
  description: "Software",
  uncertain: false,
};
const saas: PaymentRule = {
  id: "saas",
  label: "SaaS",
  category: "software",
  comparison: "under",
  threshold: 500,
  currency: "USD",
  action: "approve",
  enabled: true,
};
describe("Private invoice policy", () => {
  it("approves known Software at 150 below 500, not at the boundary", () => {
    expect(decideInvoice(invoice, [saas], true).status).toBe("approved");
    expect(decideInvoice({ ...invoice, amount: 500 }, [saas], true).status).toBe("review");
  });
  it("halts travel at 120 above 100", () => {
    expect(
      decideInvoice(
        { ...invoice, category: "travel", amount: 120 },
        [
          {
            ...saas,
            id: "travel",
            category: "travel",
            comparison: "over",
            threshold: 100,
            action: "review",
          },
        ],
        true,
      ).status,
    ).toBe("review");
  });
  it("never approves an unverified vendor", () => {
    expect(decideInvoice(invoice, [saas], false).status).toBe("review");
  });
  it("prioritizes human review over an approval rule", () => {
    expect(
      decideInvoice(invoice, [saas, { ...saas, id: "review", action: "review" }], true).status,
    ).toBe("review");
  });
  it("does not approve uncertain or mismatched-currency data", () => {
    expect(decideInvoice({ ...invoice, uncertain: true }, [saas], true).status).toBe("review");
    expect(decideInvoice({ ...invoice, currency: "COP" }, [saas], true).status).toBe("review");
  });
  it("permits only PDF and image formats up to 10 MB", () => {
    expect(validateUpload(10 * 1024 * 1024, "application/pdf")).toBe(true);
    expect(validateUpload(10 * 1024 * 1024 + 1, "application/pdf")).toBe(false);
    expect(validateUpload(10, "text/html")).toBe(false);
  });
  it("preserves supplier invoice numbers with prefixes and leading zeros", () => {
    expect(extractionSchema.parse({ ...invoice, invoiceNumber: "FAC-000042" }).invoiceNumber).toBe(
      "FAC-000042",
    );
  });
  it.each(["vendor", "invoiceNumber", "date", "description"] as const)(
    "requires %s from the document before approval",
    (field) => {
      expect(decideInvoice({ ...invoice, [field]: null }, [saas], true).status).toBe("review");
    },
  );
  it("keeps real documents disabled while legal setup is incomplete", () => {
    expect(REAL_UPLOADS_ENABLED).toBe(false);
  });
});

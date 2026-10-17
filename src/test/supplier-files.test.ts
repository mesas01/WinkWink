import { describe, it, expect } from "vitest";
import {
  compareReferenceFiles,
  referenceUploadSchema,
  validReferenceFile,
} from "../lib/supplier-files";
const fields = {
  isInvoice: true,
  vendor: "Demo",
  taxId: "TEST-CO-01",
  invoiceNumber: "FAC-001",
  category: "software",
  currency: "COP",
  bankName: null,
  bankLast4: null,
  uncertain: false,
};
const invoice = {
  taxId: "TEST-CO-01",
  invoiceNumber: "FAC-002",
  category: "software",
  currency: "COP",
};
const file = { id: "one", kind: "invoice", status: "ready", metadata: fields };
describe("initial supplier files", () => {
  it("uses a matching initial invoice among multiple formats", () =>
    expect(
      compareReferenceFiles(invoice, [
        { ...file, id: "other", metadata: { ...fields, invoiceNumber: "OTHER-001" } },
        file,
      ]),
    ).toEqual({ passed: true, reason: "uploaded_reference_matches", referenceIds: ["one"] }));
  it("requires review when future tax ID differs", () =>
    expect(compareReferenceFiles({ ...invoice, taxId: "DIFFERENT" }, [file]).passed).toBe(false));
  it("requires review when future currency differs", () =>
    expect(compareReferenceFiles({ ...invoice, currency: "BRL" }, [file]).passed).toBe(false));
  it("requires review for unreadable initial documents", () =>
    expect(
      compareReferenceFiles(invoice, [{ ...file, metadata: { ...fields, uncertain: true } }])
        .passed,
    ).toBe(false));
  it("requires review while extraction remains pending", () =>
    expect(compareReferenceFiles(invoice, [{ ...file, status: "pending" }]).passed).toBe(false));
  it("does not treat QR alone as invoice attestation", () =>
    expect(compareReferenceFiles(invoice, [{ ...file, kind: "qr" }]).reason).toBe(
      "qr_reference_only",
    ));
  it("checks beneficiary bank digits when reference contains them", () =>
    expect(
      compareReferenceFiles({ ...invoice, bankLast4: "9999" }, [
        { ...file, metadata: { ...fields, bankLast4: "4321" } },
      ]).passed,
    ).toBe(false));
  it("keeps the synthetic-document authorization required", () =>
    expect(
      referenceUploadSchema.safeParse({
        vendorId: "00000000-0000-4000-8000-000000000001",
        path: "a",
        name: "a.pdf",
        mime: "application/pdf",
        kind: "invoice",
        authorizedTest: false,
      }).success,
    ).toBe(false));
  it("rejects spoofed PDFs", () =>
    expect(validReferenceFile(3, "application/pdf", new Uint8Array([1, 2, 3]))).toBe(false));
});

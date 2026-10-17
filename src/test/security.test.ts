import { describe, it, expect } from "vitest";
import { scanSecurity, sameInvoiceNumber } from "@/lib/security";
import { runSecurityDemo, DEMO_VENDORS } from "@/lib/security-demo";
const aws = DEMO_VENDORS["AWS"];
if (!aws) throw new Error("AWS test credentials missing");
describe("Antifraud before policy", () => {
  it("blocks adulterated INV-003 with Wells Fargo 9999 instead of Chase 4321", () => {
    const r = runSecurityDemo("INV-003");
    expect(r.security.status).toBe("blocked");
    expect(r.decision.status).toBe("rejected");
    expect(r.security.en).toContain("Wells Fargo ****9999");
    expect(r.security.en).toContain("Chase ****4321");
  });
  it("passes AWS 150 with registered credentials before approving below 500", () => {
    expect(runSecurityDemo("INV-001").security.status).toBe("passed");
    expect(runSecurityDemo("INV-001").decision.status).toBe("approved");
  });
  it("keeps Uber 120 above 100 as policy review, not security block", () => {
    expect(runSecurityDemo("INV-002").security.status).toBe("passed");
    expect(runSecurityDemo("INV-002").decision.status).toBe("review");
  });
  it("blocks unknown vendors", () => {
    expect(runSecurityDemo("INV-004").security.status).toBe("blocked");
  });
  it("blocks duplicate supplier invoice IDs", () => {
    expect(runSecurityDemo("INV-005").security.status).toBe("blocked");
    expect(sameInvoiceNumber(" INV-001 ", "inv-001")).toBe(true);
    expect(sameInvoiceNumber("INV-001", "INV-002")).toBe(false);
  });
  it("requires human-confirmed credentials", () => {
    expect(scanSecurity(aws, { ...aws, verified: false }, false).status).toBe("review");
  });
  it("does not treat missing bank or tax details as a match", () => {
    expect(scanSecurity({ ...aws, bankLast4: null }, aws, false).status).toBe("review");
  });
  it("blocks tax ID mismatch", () => {
    expect(scanSecurity({ ...aws, taxId: "US-OTHER" }, aws, false).status).toBe("blocked");
  });
});

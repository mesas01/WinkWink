import { describe, expect, it } from "vitest";
import { evaluate, INVOICES } from "@/lib/agent";

const on = { saas: true, travel: true, unknown: true };
const byId = (id: string) => {
  const invoice = INVOICES.find((i) => i.id === id);
  if (!invoice) throw new Error("Missing test invoice");
  return invoice;
};

describe("Blinka agent rules", () => {
  it("auto-approves software under $500 (AWS $150)", () => {
    expect(evaluate(byId("INV-001"), on).status).toBe("paid");
  });
  it("halts travel over $100 (Uber $120)", () => {
    expect(evaluate(byId("INV-002"), on).log.key).toBe("haltTravel");
  });
  it("blocks adulterated AWS INV-003 before spending rules", () => {
    expect(evaluate(byId("INV-003"), on).status).toBe("security");
  });
  it("halts software at or above $500", () => {
    expect(evaluate({ ...byId("INV-001"), amount: 500 }, on).status).toBe("review");
  });
});

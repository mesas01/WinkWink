import { describe, expect, it } from "vitest";
import { budgetApplies, budgetOutcome, budgetSchema } from "@/lib/budgets";
describe("Employee caps and distinct demo currencies", () => {
  const invoice = { currency: "COP", category: "software", user_id: "employee1" };
  it("applies company and EMPLEADO1 caps together", () => {
    expect(budgetApplies({ currency: "COP", category: "all", employee_id: null }, invoice)).toBe(
      true,
    );
    expect(
      budgetApplies({ currency: "COP", category: "all", employee_id: "employee1" }, invoice),
    ).toBe(true);
  });
  it("does not count another employee against a personal cap", () =>
    expect(
      budgetApplies({ currency: "COP", category: "all", employee_id: "employee2" }, invoice),
    ).toBe(false));
  it("never mixes COP, BRL and USDC reservations", () => {
    for (const currency of ["BRL", "USDC"])
      expect(budgetApplies({ currency, category: "all" }, invoice)).toBe(false);
  });
  it("holds EMPLEADO1 above 1000000 COP even with manual approval", () =>
    expect(
      budgetOutcome(
        1200000,
        0,
        { per_payment: 1000000, human_above: 500000, period_limit: 1500000 },
        true,
      ),
    ).toBe("hold"));
  it("escalates EMPLEADO2 above 800 BRL within the 2000 BRL hard cap", () =>
    expect(
      budgetOutcome(1200, 0, { per_payment: 2000, human_above: 800, period_limit: 3000 }),
    ).toBe("escalate"));
  it("holds EMPLEADO3 above 600 USDC", () =>
    expect(budgetOutcome(650, 0, { per_payment: 600, human_above: 250, period_limit: 1000 })).toBe(
      "hold",
    ));
  it("reserves EMPLEADO4 prior approvals against the 1000000 COP personal month limit", () =>
    expect(
      budgetOutcome(280000, 800000, {
        per_payment: 700000,
        human_above: 300000,
        period_limit: 1000000,
      }),
    ).toBe("hold"));
  it("validates personal cap owner IDs instead of trusting arbitrary labels", () =>
    expect(
      budgetSchema.safeParse({
        label: "Personal",
        currency: "COP",
        category: "all",
        period: "month",
        per_payment: 1000000,
        human_above: 500000,
        period_limit: 1500000,
        enabled: true,
        employee_id: "EMPLEADO1",
      }).success,
    ).toBe(false));
});

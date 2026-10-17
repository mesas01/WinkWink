import { describe, expect, it } from "vitest";
import { spendMetrics, periodKey, validDate, type MetricInvoice } from "@/lib/spend-metrics";
const row: MetricInvoice = {
  id: "1",
  user_id: "a",
  amount: 150,
  currency: "USD",
  category: "software",
  status: "approved",
  invoice_date: "2026-10-15",
};
const options = { currency: "USD", employee: "all", start: "", end: "", period: "month" as const };
describe("Admin spend metrics", () => {
  it("counts approved invoice amounts, not review or rejected amounts, as spend", () => {
    const result = spendMetrics(
      [
        row,
        { ...row, status: "review", amount: 120 },
        { ...row, status: "rejected", amount: 2000 },
      ],
      options,
    );
    expect(result.total).toBe(150);
    expect(result.review).toBe(120);
    expect(result.rejected).toBe(2000);
  });
  it("never adds COP amounts to USD", () => {
    expect(spendMetrics([row, { ...row, currency: "COP", amount: 500000 }], options).total).toBe(
      150,
    );
  });
  it("divides half-months at the 15th and 16th", () => {
    expect(periodKey("2026-10-15", "half-month")).toBe("2026-10-01");
    expect(periodKey("2026-10-16", "half-month")).toBe("2026-10-16");
  });
  it("groups by day and month", () => {
    expect(periodKey("2026-10-15", "day")).toBe("2026-10-15");
    expect(periodKey("2026-10-15", "month")).toBe("2026-10");
  });
  it("filters an employee and inclusive issue-date range", () => {
    const result = spendMetrics(
      [
        row,
        { ...row, user_id: "b", amount: 300 },
        { ...row, invoice_date: "2026-10-16", amount: 400 },
      ],
      { ...options, employee: "a", start: "2026-10-15", end: "2026-10-15" },
    );
    expect(result.total).toBe(150);
    expect(result.employees).toEqual([{ key: "a", total: 150, count: 1 }]);
  });
  it("excludes missing dates and amounts without fabricating them", () => {
    const result = spendMetrics(
      [
        { ...row, invoice_date: null },
        { ...row, amount: null },
      ],
      options,
    );
    expect(result.total).toBe(0);
    expect(result.missingDates).toBe(1);
    expect(result.missingAmounts).toBe(1);
    expect(validDate("2026-02-30")).toBeNull();
  });
  it("sums categories and average independently", () => {
    const result = spendMetrics([row, { ...row, category: "travel", amount: 50 }], options);
    expect(result.categories).toEqual([
      { key: "software", total: 150, count: 1 },
      { key: "travel", total: 50, count: 1 },
    ]);
    expect(result.average).toBe(100);
  });
});

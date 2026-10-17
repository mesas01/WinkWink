import { z } from "zod";
export const budgetSchema = z.object({
  label: z.string().trim().min(1).max(120),
  currency: z.enum(["USD", "COP", "EUR", "BRL", "USDC"]),
  category: z.enum(["all", "software", "travel", "marketing", "other"]),
  period: z.enum(["day", "half_month", "month"]),
  per_payment: z.number().finite().min(0).max(1e12),
  human_above: z.number().finite().min(0).max(1e12),
  period_limit: z.number().finite().min(0).max(1e12),
  enabled: z.boolean(),
  employee_id: z.string().uuid().nullable().default(null),
});
export function budgetApplies(
  budget: { currency: string; category: string; employee_id?: string | null },
  invoice: { currency: string | null; category: string | null; user_id: string },
) {
  return (
    budget.currency === invoice.currency &&
    (budget.category === "all" || budget.category === invoice.category) &&
    (!budget.employee_id || budget.employee_id === invoice.user_id)
  );
}
export function budgetOutcome(
  amount: number,
  used: number,
  budget: { per_payment: number; human_above: number; period_limit: number },
  manual = false,
) {
  if (amount > budget.per_payment || used + amount > budget.period_limit) return "hold";
  return !manual && amount > budget.human_above ? "escalate" : "approve";
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveBudget } from "@/lib/invoices.functions";
import { budgetSchema } from "@/lib/budgets";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export function BudgetPanel({ es }: { es: boolean }) {
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveBudget);
  const limits = useQuery({
    queryKey: ["budget-limits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budget_limits").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const employees = useQuery({
    queryKey: ["budget-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name")
        .order("display_name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const period = (p: string) =>
    p === "day"
      ? es
        ? "Día"
        : "Day"
      : p === "half_month"
        ? es
          ? "Quincena"
          : "Half-month"
        : es
          ? "Mes"
          : "Month";
  return (
    <section className="mt-8 min-w-0">
      <h2 className="text-2xl font-semibold">
        {es ? "Presupuestos y aprobaciones" : "Budgets & approvals"}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {es
          ? "Reservas de decisiones aprobadas, no pagos bancarios. Periodos calendario en hora de Bogotá; quincenas 1–15 y 16–fin. Todas las restricciones activas se aplican."
          : "Approved-decision reservations, not bank payments. Calendar periods in Bogotá time; half-months 1–15 and 16–end. All active constraints apply."}
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          setBusy(true);
          try {
            await save({
              data: budgetSchema.parse({
                label: f.get("label"),
                employee_id: f.get("employee_id") || null,
                currency: f.get("currency"),
                category: f.get("category"),
                period: f.get("period"),
                per_payment: Number(f.get("per_payment")),
                human_above: Number(f.get("human_above")),
                period_limit: Number(f.get("period_limit")),
                enabled: true,
              }),
            });
            form.reset();
            await limits.refetch();
            toast.success(es ? "Presupuesto guardado" : "Budget saved");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm">
          {es ? "Aplicar a" : "Apply to"}
          <select name="employee_id" className="mt-2 w-full rounded-md border bg-background p-2">
            <option value="">
              {es ? "Empresa · todos los empleados" : "Company · all employees"}
            </option>
            {employees.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.display_name || e.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {es ? "Nombre del presupuesto" : "Budget name"}
          <Input name="label" required maxLength={120} className="mt-2" />
        </label>
        <label className="text-sm">
          {es ? "Moneda" : "Currency"}
          <select name="currency" className="mt-2 w-full rounded-md border bg-background p-2">
            {["USD", "COP", "EUR", "BRL", "USDC"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {es ? "Categoría" : "Category"}
          <select name="category" className="mt-2 w-full rounded-md border bg-background p-2">
            {[
              ["all", es ? "Todas" : "All"],
              ["software", "Software"],
              ["travel", es ? "Viáticos" : "Travel"],
              ["marketing", "Marketing"],
              ["other", es ? "Otros" : "Other"],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {es ? "Periodo" : "Period"}
          <select name="period" className="mt-2 w-full rounded-md border bg-background p-2">
            {["month", "half_month", "day"].map((p) => (
              <option key={p} value={p}>
                {period(p)}
              </option>
            ))}
          </select>
        </label>
        {(["per_payment", "human_above", "period_limit"] as const).map((n, i) => (
          <label key={n} className="text-sm">
            {
              (es
                ? [
                    "Máximo por factura",
                    "Revisión humana por encima de",
                    "Máximo acumulado del periodo",
                  ]
                : ["Maximum per invoice", "Human review above", "Maximum reserved per period"])[i]
            }
            <Input
              className="mt-2"
              name={n}
              type="number"
              required
              min={0}
              max={1e12}
              step="0.01"
            />
          </label>
        ))}
        <Button disabled={busy} className="self-end">
          <Save />
          {es ? "Guardar presupuesto" : "Save budget"}
        </Button>
      </form>
      {limits.isPending && <Loader2 className="mt-6 animate-spin" />}
      {limits.error && (
        <p role="alert" className="mt-6 text-destructive">
          {limits.error.message}
        </p>
      )}
      <ul className="mt-8 divide-y border-y">
        {limits.data?.map((b) => (
          <li key={b.id} className="flex items-start justify-between gap-4 py-5">
            <div className="min-w-0 break-words">
              <h3 className="font-semibold">{b.label}</h3>
              <p className="mt-2 text-sm">
                {b.employee_id
                  ? employees.data?.find((e) => e.id === b.employee_id)?.display_name ||
                    b.employee_id.slice(0, 8)
                  : es
                    ? "Empresa"
                    : "Company"}{" "}
                · {b.currency} · {period(b.period)} · {b.category}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {es ? "Por factura" : "Per invoice"}: {b.per_payment} · {es ? "Revisión" : "Review"}
                : &gt; {b.human_above} · {es ? "Acumulado" : "Reserved limit"}: {b.period_limit}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              aria-label={`${es ? "Eliminar presupuesto" : "Delete budget"}: ${b.label}`}
              onClick={async () => {
                setBusy(true);
                try {
                  const { error } = await supabase.from("budget_limits").delete().eq("id", b.id);
                  if (error) throw error;
                  await limits.refetch();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Error");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

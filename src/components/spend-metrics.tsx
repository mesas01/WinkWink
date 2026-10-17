import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, Loader2, Download, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { spendMetrics, type MetricInvoice, type Period } from "@/lib/spend-metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SpendMetrics({ es, userId }: { es: boolean; userId: string }) {
  const [currency, setCurrency] = useState("COP");
  const [employee, setEmployee] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const reduced = useReducedMotion();
  const query = useQuery({
    queryKey: ["admin-spend-metrics", userId],
    queryFn: async () => {
      const rows: MetricInvoice[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase
          .from("invoices")
          .select("id,user_id,amount,currency,category,status,invoice_date,profiles(display_name)")
          .order("id")
          .range(offset, offset + 499);
        if (error) throw new Error(error.message);
        rows.push(...(data ?? []));
        if (!data || data.length < 500) return rows;
      }
    },
  });
  const invoices = query.data ?? [];
  const currencies = [
    ...new Set([
      "COP",
      "USD",
      "EUR",
      ...invoices.map((i) => i.currency).filter((c): c is string => Boolean(c)),
    ]),
  ];
  const employees = [
    ...new Map(
      invoices.map((i) => [
        i.user_id,
        i.profiles?.display_name || `${es ? "Empleado" : "Employee"} · ${i.user_id.slice(0, 8)}`,
      ]),
    ).entries(),
  ];
  const result = spendMetrics(invoices, { currency, employee, start, end, period });
  const invalidRange = Boolean(start && end && start > end);
  const money = (amount: number) =>
    `${currency} ${amount.toLocaleString(es ? "es-CO" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const categoryName = (key: string) =>
    ({
      software: "Software / SaaS",
      travel: es ? "Viáticos" : "Travel",
      marketing: "Marketing",
      other: es ? "Otros gastos" : "Other expenses",
      unclassified: es ? "Sin categoría" : "Unclassified",
    })[key] ?? key;
  const periodName = (key: string) => {
    if (period === "day") return key;
    const month = new Date(`${key.slice(0, 7)}-01T12:00:00Z`).toLocaleDateString(
      es ? "es-CO" : "en",
      { month: "short", year: "numeric", timeZone: "UTC" },
    );
    return period === "month"
      ? month
      : `${month} · ${key.endsWith("-01") ? "1–15" : es ? "16–fin" : "16–end"}`;
  };
  function exportCsv() {
    const records = [
      ["period", "currency", "approved_amount", "invoice_count"],
      ...result.periods.map((p) => [p.key, currency, p.total.toFixed(2), String(p.count)]),
    ];
    const csv = records
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `winkwink-${currency}-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 min-w-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">{es ? "Métricas de gasto" : "Spend metrics"}</h2>
        <Button
          variant="outline"
          disabled={!result.periods.length || invalidRange}
          onClick={exportCsv}
        >
          <Download />
          {es ? "Exportar CSV" : "Export CSV"}
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {es
          ? "Importes aprobados · fecha de emisión · monedas sin conversión · no representa pagos bancarios."
          : "Approved amounts · invoice issue date · no currency conversion · not bank payments."}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 border-y py-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="min-w-0 text-sm font-medium">
          {es ? "Moneda" : "Currency"}
          <select
            aria-label={es ? "Moneda" : "Currency"}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-2 h-11 w-full rounded-md border bg-background px-3"
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm font-medium">
          {es ? "Empleado" : "Employee"}
          <select
            aria-label={es ? "Empleado" : "Employee"}
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="mt-2 h-11 w-full rounded-md border bg-background px-3"
          >
            <option value="all">{es ? "Todos los empleados" : "All employees"}</option>
            {employees.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm font-medium">
          {es ? "Desde" : "From"}
          <Input
            aria-invalid={invalidRange}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-2 h-11 w-full min-w-0"
          />
        </label>
        <label className="min-w-0 text-sm font-medium">
          {es ? "Hasta" : "To"}
          <Input
            aria-invalid={invalidRange}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-2 h-11 w-full min-w-0"
          />
        </label>
      </div>
      {invalidRange && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {es
            ? "La fecha final debe ser igual o posterior a la inicial."
            : "The end date must be on or after the start date."}
        </p>
      )}
      {query.isPending ? (
        <p role="status" className="flex items-center gap-2 py-12">
          <Loader2 className="size-4 animate-spin" />
          {es ? "Cargando métricas…" : "Loading metrics…"}
        </p>
      ) : query.isError ? (
        <div role="alert" className="py-8">
          <p className="text-destructive">
            {es ? "No se pudieron cargar las métricas." : "Could not load metrics."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
            {es ? "Reintentar" : "Retry"}
          </Button>
        </div>
      ) : (
        !invalidRange && (
          <>
            <div className="grid gap-x-8 gap-y-6 border-b py-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [es ? "Gasto aprobado" : "Approved spend", money(result.total)],
                [es ? "En revisión" : "In review", money(result.review)],
                [es ? "Facturas aprobadas" : "Approved invoices", result.count],
                [es ? "Promedio por factura" : "Average invoice", money(result.average)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>
                {es ? "Total presentado" : "Total submitted"}: {money(result.submitted)}
              </span>
              <span>
                {es ? "Rechazado" : "Rejected"}: {money(result.rejected)}
              </span>
            </div>
            {(result.missingDates > 0 || result.missingAmounts > 0) && (
              <p role="status" className="mt-4 text-sm text-warning">
                {es
                  ? `Excluidas: ${result.missingDates} sin fecha válida y ${result.missingAmounts} sin importe válido.`
                  : `Excluded: ${result.missingDates} without valid dates and ${result.missingAmounts} without valid amounts.`}
              </p>
            )}
            <section className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">
                  {es ? "Evolución del gasto" : "Spend over time"}
                </h3>
                <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
                  {(["day", "half-month", "month"] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={period === p ? "secondary" : "ghost"}
                      aria-pressed={period === p}
                      onClick={() => setPeriod(p)}
                    >
                      {p === "day"
                        ? es
                          ? "Días"
                          : "Days"
                        : p === "half-month"
                          ? es
                            ? "Quincenas"
                            : "Half-months"
                          : es
                            ? "Meses"
                            : "Months"}
                    </Button>
                  ))}
                </div>
              </div>
              {result.periods.length === 0 ? (
                <div className="py-14 text-center">
                  <BarChart3 className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {es
                      ? "Sin gasto aprobado para estos filtros."
                      : "No approved spend for these filters."}
                  </p>
                </div>
              ) : (
                <div className="mt-6 max-h-96 space-y-5 overflow-y-auto pr-2">
                  {result.periods.map((p) => (
                    <div key={p.key}>
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span>{periodName(p.key)}</span>
                        <span className="font-medium tabular-nums">{money(p.total)}</span>
                      </div>
                      <progress
                        aria-label={`${periodName(p.key)}: ${money(p.total)}`}
                        max={Math.max(1, ...result.periods.map((p) => p.total))}
                        value={p.total}
                        className="mt-2 block h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <section>
                <h3 className="text-lg font-semibold">{es ? "Por categoría" : "By category"}</h3>
                <ul className="mt-5 divide-y border-y">
                  {result.categories.map((c) => (
                    <li key={c.key} className="flex flex-wrap justify-between gap-3 py-4 text-sm">
                      <span>
                        {categoryName(c.key)}
                        <span className="ml-2 text-muted-foreground">({c.count})</span>
                      </span>
                      <span className="font-medium tabular-nums">{money(c.total)}</span>
                    </li>
                  ))}
                </ul>
                {!result.categories.length && (
                  <p className="py-6 text-sm text-muted-foreground">
                    {es ? "Sin importes por categoría." : "No category amounts."}
                  </p>
                )}
              </section>
              <section>
                <h3 className="text-lg font-semibold">{es ? "Por empleado" : "By employee"}</h3>
                <ul className="mt-5 divide-y border-y">
                  {result.employees.map((e) => (
                    <li key={e.key} className="py-4">
                      <Button
                        variant="ghost"
                        onClick={() => setEmployee(e.key)}
                        className="h-auto w-full justify-between gap-3 px-0 text-left whitespace-normal"
                      >
                        <span className="min-w-0 break-words">
                          {employees.find(([id]) => id === e.key)?.[1]}
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            {e.count} {es ? "facturas aprobadas" : "approved invoices"} ·{" "}
                            {es ? "promedio" : "average"} {money(e.total / e.count)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="tabular-nums">{money(e.total)}</span>
                          <ArrowUpRight />
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
                {!result.employees.length && (
                  <p className="py-6 text-sm text-muted-foreground">
                    {es ? "Sin gasto aprobado por empleado." : "No approved employee spend."}
                  </p>
                )}
              </section>
            </div>
          </>
        )
      )}
    </motion.section>
  );
}

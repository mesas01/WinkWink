import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Building2, CircleDollarSign, Check, Loader2, Play, Users } from "lucide-react";
import { toast } from "sonner";
import { evaluateTransferDemo, createDemoEmployeeAccess } from "@/lib/invoices.functions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Stamp } from "./stamp";
import { invoiceStampTone } from "@/lib/stamp";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import type { Database } from "@/integrations/supabase/types";
type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Budget = Database["public"]["Tables"]["budget_limits"]["Row"];
type Employee = { id: string; display_name: string; demo_employee: boolean };
export function TransferDemo({
  invoices,
  budgets,
  employees,
  isAdmin,
  es,
  refresh,
  onInvoice,
}: {
  invoices: Invoice[];
  budgets: Budget[];
  employees: Employee[];
  isAdmin: boolean;
  es: boolean;
  refresh: () => Promise<unknown>;
  onInvoice: (id: string) => void;
}) {
  const [employee, setEmployee] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const evaluate = useServerFn(evaluateTransferDemo);
  const access = useServerFn(createDemoEmployeeAccess);
  const qc = useQueryClient();
  const [loginEmployee, setLoginEmployee] = useState<Employee | null>(null);
  const demo = invoices.filter((i) => i.demo_scenario);
  const list = demo.filter(
    (i) =>
      (employee === "all" || i.user_id === employee) &&
      (currency === "all" || i.currency === currency),
  );
  const format = (n: number) => n.toLocaleString(es ? "es-CO" : "en");
  const name = (id: string) =>
    employees.find((e) => e.id === id)?.display_name || (es ? "Empleado" : "Employee");
  const channel = (c: string | null) =>
    c === "pix" ? "Pix" : c === "usdc" ? "USDC" : es ? "Transferencia bancaria" : "Bank transfer";
  const label = (i: Invoice) => {
    const d = i.decision_snapshot;
    const outcome = d && typeof d === "object" && !Array.isArray(d) ? d["budgetOutcome"] : null;
    return i.status === "approved"
      ? es
        ? "Aprobada · simulación"
        : "Approved · simulated"
      : i.status === "rejected"
        ? es
          ? "Frenada"
          : "Held"
        : i.status === "review"
          ? outcome === "hold"
            ? es
              ? "Frenada por tope"
              : "Held by cap"
            : es
              ? "Revisión humana"
              : "Human review"
          : i.status === "error"
            ? es
              ? "Error"
              : "Error"
            : es
              ? "Por evaluar"
              : "Ready to evaluate";
  };
  async function run(i: Invoice) {
    setBusy(i.id);
    setStep(1);
    try {
      for (let s = 2; s <= 3; s++) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setStep(s);
      }
      const result = await evaluate({ data: { id: i.id } });
      if (!result.ok) toast.error(result.message);
      else
        toast.success(
          es ? "Decisión registrada · sin mover dinero" : "Decision recorded · no money moved",
        );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(null);
      setStep(0);
    }
  }
  return (
    <section className="mt-7 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm font-medium text-primary">
            {es ? "DEMO · CONTEXTO BLINKA" : "DEMO · BLINKA CONTEXT"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {es ? "Solicitudes de transferencia" : "Transfer requests"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {es
              ? "Datos ficticios · decisiones simuladas · sin plataformas conectadas ni conversión de monedas."
              : "Fictional data · simulated decisions · no connected platforms or currency conversion."}
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm">
          <Users className="size-4" />
          {employees.filter((e) => e.demo_employee).length}{" "}
          {es ? "empleados de prueba" : "test employees"}
        </span>
      </div>
      <div className="grid gap-4 border-b py-6 sm:grid-cols-3">
        {["COP", "BRL", "USDC"].map((c) => (
          <div key={c}>
            <p className="flex items-center gap-2 font-semibold">
              <CircleDollarSign className="size-4 text-primary" />
              {c}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {format(
                demo
                  .filter((i) => i.currency === c && i.status === "approved")
                  .reduce((sum, i) => sum + (i.amount ?? 0), 0),
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {es
                ? "Aprobado en esta demo · no transferido"
                : "Approved in this demo · not transferred"}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        {isAdmin && (
          <label className="min-w-0 text-sm">
            {es ? "Solicitante" : "Requester"}
            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="mt-2 block w-full rounded-md border bg-background p-2"
            >
              <option value="all">{es ? "Todos los empleados" : "All employees"}</option>
              {employees
                .filter((e) => e.demo_employee)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.display_name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          {es ? "Moneda" : "Currency"}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-2 block w-full rounded-md border bg-background p-2"
          >
            <option value="all">{es ? "Todas" : "All"}</option>
            {["COP", "BRL", "USDC"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-sm text-muted-foreground">
          {list.length} {es ? "solicitudes" : "requests"}
        </span>
      </div>
      {busy && (
        <div
          role="status"
          className="mt-5 flex items-center gap-3 border-y py-4 text-sm text-primary"
        >
          <Loader2 className="size-4 animate-spin" />
          {
            (es
              ? [
                  "",
                  "Leyendo factura sintética…",
                  "Comparando referencia del proveedor…",
                  "Aplicando topes de empresa y empleado…",
                ]
              : [
                  "",
                  "Reading synthetic invoice…",
                  "Comparing supplier reference…",
                  "Applying company and employee caps…",
                ])[step]
          }
        </div>
      )}
      <ul className="mt-5 divide-y divide-dashed divide-input border-y-2 border-rule">
        {list.map((i) => (
          <li key={i.id} className="grid min-w-0 gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {name(i.user_id)} · {i.invoice_number}
                </span>
                <Stamp tone={invoiceStampTone(i)} es={es} label={label(i)} />
              </div>
              <h3 className="mt-2 break-words text-lg font-semibold">{i.vendor}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Building2 className="size-4 text-muted-foreground" />
                <span>{channel(i.proposed_channel)}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="typed font-bold">
                  {i.currency} {format(i.amount ?? 0)}
                </span>
                <span className="text-muted-foreground">
                  · {es ? "Vence" : "Due"} {i.due_date}
                </span>
              </div>
              <p className="mt-2 break-words text-xs text-muted-foreground">
                {i.proposed_destination}
              </p>
              {i.status !== "pending" && (
                <p className="mt-3 break-words text-sm">
                  {es ? i.explanation_es : i.explanation_en}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end md:justify-center">
              <Button variant="outline" disabled={busy !== null} onClick={() => onInvoice(i.id)}>
                {es ? "Ver factura" : "View invoice"}
              </Button>
              {i.status === "pending" && (
                <Button disabled={busy !== null} onClick={() => run(i)}>
                  {busy === i.id ? <Loader2 className="animate-spin" /> : <Play />}
                  {es ? "Evaluar solicitud" : "Evaluate request"}
                </Button>
              )}
              {i.status === "approved" && (
                <span className="flex items-center gap-2 text-xs text-success">
                  <Check className="size-4" />
                  {es ? "Decisión guardada" : "Decision saved"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="py-8 text-sm text-muted-foreground">
          {es ? "Sin solicitudes para este filtro." : "No requests match these filters."}
        </p>
      )}
      <h3 className="mt-9 text-xl font-semibold">{es ? "Topes personales" : "Personal caps"}</h3>
      <ul className="mt-4 divide-y border-y">
        {budgets
          .filter(
            (b) =>
              b.employee_id &&
              (employee === "all" || b.employee_id === employee) &&
              (currency === "all" || b.currency === currency),
          )
          .map((b) => (
            <li key={b.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="font-medium">
                  {b.employee_id ? name(b.employee_id) : ""} · {b.currency}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {es ? "Por factura" : "Per invoice"}: {format(b.per_payment)} ·{" "}
                  {es ? "Escalar sobre" : "Escalate above"}: {format(b.human_above)}
                </p>
              </div>
              <p className="text-sm">
                {es ? "Tope" : "Cap"}: {format(b.period_limit)} {b.currency} /{" "}
                {b.period === "month"
                  ? es
                    ? "mes"
                    : "month"
                  : b.period === "day"
                    ? es
                      ? "día"
                      : "day"
                    : es
                      ? "quincena"
                      : "half-month"}
              </p>
            </li>
          ))}
      </ul>
      {isAdmin && (
        <section className="mt-8">
          <h3 className="text-xl font-semibold">{es ? "Cuentas de prueba" : "Test accounts"}</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {employees
              .filter((e) => e.demo_employee)
              .map((e) => (
                <Button
                  key={e.id}
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => setLoginEmployee(e)}
                >
                  <Users />
                  {es ? "Entrar como" : "Sign in as"} {e.display_name}
                </Button>
              ))}
          </div>
        </section>
      )}
      <Dialog
        open={Boolean(loginEmployee)}
        onOpenChange={(open) => {
          if (!open && !busy) setLoginEmployee(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {es ? "Entrar como" : "Sign in as"} {loginEmployee?.display_name}
          </DialogTitle>
          <DialogDescription>
            {es
              ? "Cambiarás a una cuenta real de prueba, con acceso únicamente a sus facturas y topes. Para volver a administración deberás cerrar sesión e ingresar con tu cuenta habitual."
              : "You will switch to an actual test account that can only access its own invoices and caps. To return to administration, sign out and use your usual account."}
          </DialogDescription>
          <Button
            disabled={busy !== null}
            onClick={async () => {
              if (!loginEmployee) return;
              setBusy("login");
              try {
                const { tokenHash } = await access({ data: { id: loginEmployee.id } });
                await qc.cancelQueries();
                const { error } = await supabase.auth.verifyOtp({
                  token_hash: tokenHash,
                  type: "magiclink",
                });
                if (error) throw error;
                qc.clear();
                window.location.assign("/dashboard");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Error");
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Users />}
            {es ? "Cambiar a cuenta de prueba" : "Switch to test account"}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

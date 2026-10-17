import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Play, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { runAntifraudDemo } from "@/lib/invoices.functions";
import { DEMO_INVOICES, DEMO_VENDORS, type runSecurityDemo } from "@/lib/security-demo";
import { cn } from "@/lib/utils";

const steps = {
  es: [
    "Leyendo metadatos del PDF…",
    "Verificando cuenta bancaria registrada…",
    "Verificando facturas duplicadas…",
    "Evaluando límites de política…",
  ],
  en: [
    "Reading invoice metadata & OCR…",
    "Cross-checking bank account against verified vendor DB…",
    "Scanning for duplicate invoice IDs…",
    "Evaluating company policy limits…",
  ],
};
export function ScanChecklist({
  es,
  running,
  complete = false,
  simulated = false,
}: {
  es: boolean;
  running: boolean;
  complete?: boolean;
  simulated?: boolean;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!running || !simulated) {
      setStep(0);
      return;
    }
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 375);
    return () => clearInterval(timer);
  }, [running, simulated]);
  const labels = simulated
    ? steps[es ? "es" : "en"]
    : es
      ? [
          "Lectura de factura y vencimiento…",
          "Comparación de referencia confirmada…",
          "Control de duplicados…",
          "Reglas y reservas de presupuesto…",
        ]
      : [
          "Reading invoice and due date…",
          "Comparing confirmed supplier reference…",
          "Checking duplicates…",
          "Rules and budget reservations…",
        ];
  return (
    <ol aria-label={es ? "Evaluación de factura" : "Invoice evaluation"} className="space-y-3 py-4">
      {labels.map((label, i) => (
        <li
          key={i}
          className={cn(
            "flex items-start gap-3 text-sm leading-6",
            complete || (simulated && i < step)
              ? "text-success"
              : running && i === step
                ? "text-primary"
                : "text-muted-foreground",
          )}
        >
          {complete || (simulated && i < step) ? (
            <Check className="mt-1 size-4 shrink-0" />
          ) : running && i === step ? (
            <Loader2 className="mt-1 size-4 shrink-0 animate-spin motion-reduce:animate-none" />
          ) : (
            <span className="mt-1 flex size-4 shrink-0 items-center justify-center text-xs">
              {i + 1}
            </span>
          )}
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
export function SecurityBadge({ status, es }: { status: string | null; es: boolean }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-md px-2 py-1 text-xs font-medium whitespace-normal",
        status === "blocked"
          ? "bg-destructive-soft text-destructive"
          : status === "passed"
            ? "bg-success-soft text-success"
            : "bg-warning-soft text-warning",
      )}
    >
      {status === "passed" ? (
        <ShieldCheck className="size-4 shrink-0" />
      ) : (
        <ShieldAlert className="size-4 shrink-0" />
      )}
      {status === "blocked"
        ? es
          ? "BLOQUEADO POR ALERTA DE SEGURIDAD"
          : "BLOCKED — POSSIBLY ADULTERATED"
        : status === "passed"
          ? es
            ? "Datos registrados coincidentes"
            : "Registered details match"
          : es
            ? "Seguridad pendiente"
            : "Security pending"}
    </span>
  );
}
export function SecurityDemo({ es }: { es: boolean }) {
  const [selected, setSelected] = useState("INV-003");
  const [result, setResult] = useState<ReturnType<typeof runSecurityDemo> | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const reduced = useReducedMotion();
  const run = useServerFn(runAntifraudDemo);
  const invoice = DEMO_INVOICES.find((i) => i.number === selected);
  const vendor = invoice ? DEMO_VENDORS[invoice.vendor] : null;
  async function execute() {
    setRunning(true);
    setResult(null);
    setError("");
    try {
      const [out] = await Promise.all([
        run({ data: { number: selected } }),
        new Promise<void>((resolve) => setTimeout(resolve, reduced ? 0 : 1500)),
      ]);
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRunning(false);
    }
  }
  return (
    <section className="mt-7 min-w-0 border-t pt-7">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-6 text-primary" />
        <h2 className="text-xl font-semibold">{es ? "Prueba antifraude" : "Antifraud test"}</h2>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {es ? "DATOS SINTÉTICOS" : "SYNTHETIC DATA"}
        </span>
      </div>
      <div className="mt-6 grid min-w-0 gap-7 md:grid-cols-2">
        <div className="min-w-0">
          <label className="block text-sm font-medium">
            {es ? "Factura de prueba" : "Test invoice"}
            <select
              disabled={running}
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setResult(null);
              }}
              className="mt-2 w-full rounded-md border bg-background p-3"
            >
              {DEMO_INVOICES.map((i) => (
                <option key={i.number} value={i.number}>
                  {i.number} · {i.vendor}
                  {i.number === "INV-003"
                    ? es
                      ? " · Factura adulterada"
                      : " · Adulterated invoice"
                    : "duplicate" in i
                      ? es
                        ? " · Duplicada"
                        : " · Duplicate"
                      : ""}
                </option>
              ))}
            </select>
          </label>
          {invoice && (
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{es ? "Proveedor" : "Supplier"}</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  {invoice.vendor}
                  {vendor?.verified && (
                    <ShieldCheck
                      aria-label={
                        es ? "Registro sintético verificado" : "Verified synthetic record"
                      }
                      className="size-4 text-success"
                    />
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {es ? "Cuenta en factura" : "Account on invoice"}
                </dt>
                <dd className="mt-1 break-words">
                  {invoice.bankName ? `${invoice.bankName} ****${invoice.bankLast4}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {es ? "Cuenta registrada" : "Registered account"}
                </dt>
                <dd className="mt-1 break-words">
                  {vendor ? `${vendor.bankName} ****${vendor.bankLast4}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {es ? "Identificación fiscal registrada" : "Registered tax ID"}
                </dt>
                <dd className="mt-1">{vendor?.taxId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{es ? "Monto" : "Amount"}</dt>
                <dd className="mt-1 font-medium">USD {invoice.amount}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="min-w-0">
          <ScanChecklist es={es} running={running} complete={Boolean(result)} simulated />
          <Button
            onClick={execute}
            disabled={running}
            className="h-auto min-h-11 w-full whitespace-normal"
          >
            {running ? (
              <Loader2 className="shrink-0 animate-spin" />
            ) : (
              <Play className="shrink-0" />
            )}
            {es ? "Ejecutar agente WinkWink" : "Run WinkWink agent"}
          </Button>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {result && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              role={result.security.status === "blocked" ? "alert" : "status"}
              className="mt-5 space-y-3"
            >
              <SecurityBadge es={es} status={result.security.status} />
              {result.security.status === "passed" && (
                <p
                  className={cn(
                    "text-sm font-medium",
                    result.decision.status === "review" ? "text-warning" : "text-success",
                  )}
                >
                  {result.decision.status === "review"
                    ? es
                      ? "Revisión por política"
                      : "Policy halt"
                    : es
                      ? "Aprobada · sin pago ejecutado"
                      : "Approved · no payment executed"}
                </p>
              )}
              <p className="break-words text-sm leading-6">
                {es ? result.decision.es : result.decision.en}
              </p>
            </motion.div>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        {es
          ? "Simulación de evaluación. Estas pruebas no se guardan como facturas, gastos ni registros reales. WinkWink no ejecuta pagos."
          : "Evaluation simulation. These tests are not saved as real invoices, spend or audit records. WinkWink does not execute payments."}
      </p>
    </section>
  );
}

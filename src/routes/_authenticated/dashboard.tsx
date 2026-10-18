import { TransferDemo } from "@/components/transfer-demo";
import { InvoiceDecision } from "@/components/invoice-decision";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  LogOut,
  Plus,
  Loader2,
  Check,
  X,
  ShieldCheck,
  FolderOpen,
  Settings,
  Download,
  Eye,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { workspaceOptions } from "@/lib/workspace";
import { adminUiVisible, inboxFor } from "@/lib/preview";
import { useApp } from "@/lib/store";
import { evaluateUploadedInvoice, savePaymentRule } from "@/lib/invoices.functions";
import { POLICY_VERSION, validateUpload, ruleSchema } from "@/lib/invoice-policy";
import { Logo, ThemeToggle, LangSwitch } from "@/components/blinka";
import { LegalLinks } from "@/components/legal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AdminPanel } from "@/components/admin-panel";
import { CameraCapture } from "@/components/camera-capture";
import { WorkspaceTabs, viewTitle } from "@/components/workspace-tabs";
import {
  InvoiceLedger,
  LedgerFilters,
  filterInvoices,
  type LedgerFilter,
} from "@/components/invoice-ledger";
import { Stamp } from "@/components/stamp";
import { invoiceStampTone } from "@/lib/stamp";
import { readBankComparison } from "@/lib/security-view";
import { BankMismatch, SupplierReferenceLine } from "@/components/security-detail";
import { ScanChecklist, SecurityBadge } from "@/components/security-scan";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  head: () => ({
    meta: [
      { title: "Facturas — WinkWink" },
      {
        name: "description",
        content: "Historial privado de facturas y revisión de documentos en WinkWink.",
      },
      { property: "og:title", content: "Facturas — WinkWink" },
      { property: "og:description", content: "Facturas, documentos y reglas de revisión." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});
function Dashboard() {
  const { data: w } = useSuspenseQuery(workspaceOptions);
  const qc = useQueryClient();
  const nav = useNavigate();
  const lang = useApp((s) => s.lang);
  const es = lang === "es";
  const employeePreview = useApp((s) => s.employeePreview);
  const setEmployeePreview = useApp((s) => s.setEmployeePreview);
  const [view, setView] = useState<"history" | "rules" | "privacy" | "demo">("demo");
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Places a camera photo into the form's file input, so the existing upload flow sends it. */
  const putCapturedPhoto = (photo: File) => {
    if (!fileInputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(photo);
    fileInputRef.current.files = transfer.files;
    toast.success(es ? `Foto lista: ${photo.name}` : `Photo ready: ${photo.name}`);
  };
  const [ruleOpen, setRuleOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const evaluate = useServerFn(evaluateUploadedInvoice);
  const addRule = useServerFn(savePaymentRule);
  const refresh = () => qc.invalidateQueries({ queryKey: workspaceOptions.queryKey });
  const adminUi = adminUiVisible(w.isAdmin, employeePreview);
  const own = inboxFor(w.invoices, w.isAdmin, employeePreview, w.user.id);
  const inv = own.find((i) => i.id === selected);
  const list = filterInvoices(own, filter);
  const [events, setEvents] = useState<
    { message_es: string; message_en: string; created_at: string }[]
  >([]);
  async function showInvoice(id: string) {
    setSelected(id);
    setPreview("");
    setEvents([]);
    setPreviewBusy(true);
    const invoice = w.invoices.find((i) => i.id === id);
    if (!invoice) return;
    try {
      const [url, log] = await Promise.all([
        supabase.storage.from("invoice-originals").createSignedUrl(invoice.storage_path, 600),
        supabase
          .from("invoice_events")
          .select("message_es,message_en,created_at")
          .eq("invoice_id", id)
          .order("created_at"),
      ]);
      if (url.error || log.error) throw new Error(url.error?.message ?? log.error?.message);
      setPreview(url.data?.signedUrl ?? "");
      setEvents(log.data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setPreviewBusy(false);
    }
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await nav({ to: "/login", replace: true });
  }
  function togglePreview() {
    const next = !employeePreview;
    setEmployeePreview(next);
    if (next) {
      setView("history");
      setSelected(null);
    }
  }
  async function consent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("consents")
      .insert({ user_id: w.user.id, terms_version: POLICY_VERSION });
    setBusy(false);
    if (error) toast.error(error.message);
    else await refresh();
  }
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("file");
    if (!(file instanceof File) || !validateUpload(file.size, file.type)) {
      toast.error(
        es
          ? "Selecciona un PDF, JPG, PNG o WebP de hasta 10 MB."
          : "Choose a PDF, JPG, PNG or WebP up to 10 MB.",
      );
      return;
    }
    setBusy(true);
    const id = crypto.randomUUID();
    const path = `${w.user.id}/${id}/original`;
    let inserted = false;
    try {
      const name = file.name.slice(0, 200);
      const { error: fileError } = await supabase.storage
        .from("invoice-originals")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (fileError) throw fileError;
      const { error } = await supabase.from("invoices").insert({
        id,
        user_id: w.user.id,
        storage_path: path,
        file_name: name,
        mime_type: file.type,
        test_document: true,
      });
      if (error) throw error;
      inserted = true;
      setUploadOpen(false);
      form.reset();
      await refresh();
      const result = await evaluate({ data: { id } });
      if (!result.ok) toast.error(result.message);
      else toast.success(es ? "Factura evaluada" : "Invoice evaluated");
      await refresh();
    } catch (error) {
      if (!inserted) await supabase.storage.from("invoice-originals").remove([path]);
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function createRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const rule = ruleSchema.parse({
        label: f.get("label"),
        category: f.get("category"),
        comparison: f.get("comparison"),
        threshold: Number(f.get("threshold")),
        currency: f.get("currency"),
        action: f.get("action"),
        enabled: true,
      });
      await addRule({ data: rule });
      setRuleOpen(false);
      await refresh();
      toast.success(es ? "Regla guardada" : "Rule saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function resolve(status: "approved" | "rejected") {
    if (!inv) return;
    setBusy(true);
    const { error } = await supabase.rpc("resolve_invoice", { _id: inv.id, _status: status });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      setSelected(null);
      await refresh();
    }
  }
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b-2 border-rule bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-8">
          <Logo />
          <div className="flex shrink-0 items-center gap-2">
            <span className="mr-2 hidden text-right text-xs leading-tight md:block">
              <span className="block font-semibold">{w.profile?.display_name || w.user.email}</span>
              <span className="text-muted-foreground">
                {adminUi
                  ? es
                    ? "Admin financiero"
                    : "Finance admin"
                  : es
                    ? "Empleado"
                    : "Employee"}
              </span>
            </span>
            <LangSwitch />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label={es ? "Cerrar sesión" : "Sign out"}
              title={es ? "Cerrar sesión" : "Sign out"}
              onClick={signOut}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">
            {viewTitle(view, adminUi, es)}
          </h1>
          {w.consent && view === "history" && (
            <Button onClick={() => setUploadOpen(true)} disabled={busy} className="shrink-0">
              <Upload />
              {es ? "Subir factura" : "Upload invoice"}
            </Button>
          )}
        </div>
        {!w.consent ? (
          <section className="mt-10 max-w-xl">
            <h2 className="text-xl font-semibold">
              {es ? "Autorización de tratamiento" : "Data-processing authorization"}
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {es
                ? "WinkWink tratará tu nombre, cuenta y documentos para revisión, historial y seguridad mediante Lovable Cloud y Lovable AI. El uso de documentos reales permanece deshabilitado mientras se completan contacto, acuerdos y conservación."
                : "WinkWink processes your account, name and documents for review, history and security through Lovable Cloud and Lovable AI. Real-document use remains disabled pending contact, agreements and retention verification."}
            </p>
            <LegalLinks />
            <form onSubmit={consent} className="mt-5 space-y-4">
              <label className="flex items-start gap-3 text-sm leading-6">
                <input required type="checkbox" className="mt-1 size-5 shrink-0" />
                {es
                  ? "He leído los términos y la política de privacidad, tengo al menos 18 años y autorizo este tratamiento para las finalidades indicadas."
                  : "I have read the terms and privacy policy, am at least 18, and authorize processing for the stated purposes."}
              </label>
              <Button disabled={busy} type="submit">
                {es ? "Autorizar y continuar" : "Authorize and continue"}
              </Button>
            </form>
          </section>
        ) : (
          <>
            {w.isAdmin && employeePreview && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3">
                <p className="text-sm font-medium text-warning">
                  {es
                    ? "Vista de empleado: solo cambia lo que ves. Tu cuenta sigue siendo de administración."
                    : "Employee view: only what you see changes. Your account is still an administrator."}
                </p>
                <Button size="sm" variant="outline" onClick={() => setEmployeePreview(false)}>
                  {es ? "Salir de la vista" : "Exit view"}
                </Button>
              </div>
            )}
            <div className="mt-6">
              <WorkspaceTabs
                view={view}
                onView={setView}
                adminUi={adminUi}
                isAdmin={w.isAdmin}
                employeePreview={employeePreview}
                onTogglePreview={togglePreview}
                es={es}
              />
            </div>
            {view === "demo" && (
              <TransferDemo
                invoices={own}
                budgets={adminUi ? w.budgets : w.budgets.filter((b) => b.employee_id === w.user.id)}
                employees={adminUi ? w.employees : w.employees.filter((e) => e.id === w.user.id)}
                isAdmin={adminUi}
                es={es}
                refresh={refresh}
                onInvoice={showInvoice}
              />
            )}
            {view === "history" && (
              <section className="mt-6">
                <LedgerFilters invoices={own} filter={filter} onFilter={setFilter} es={es} />
                {busy && (
                  <div role="status" className="mt-5">
                    <p className="text-sm font-semibold text-ink-violet">
                      {es ? "Guardando y evaluando documento…" : "Saving and evaluating document…"}
                    </p>
                    <ScanChecklist es={es} running={busy} />
                  </div>
                )}
                <InvoiceLedger
                  invoices={list}
                  adminUi={adminUi}
                  es={es}
                  lang={lang}
                  onOpen={showInvoice}
                  onUpload={() => setUploadOpen(true)}
                />
              </section>
            )}
            {view === "rules" && adminUi && (
              <AdminPanel
                workspace={w}
                es={es}
                refresh={refresh}
                onAddRule={() => setRuleOpen(true)}
                onInvoice={showInvoice}
              />
            )}
            {view === "privacy" && (
              <section className="mt-7 max-w-2xl">
                <h2 className="text-xl font-semibold">
                  {es ? "Solicitudes de datos personales" : "Personal-data requests"}
                </h2>
                <LegalLinks />
                <form
                  className="mt-5 space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    try {
                      const input = z
                        .object({
                          kind: z.enum([
                            "access",
                            "correction",
                            "deletion",
                            "revocation",
                            "complaint",
                          ]),
                          message: z.string().trim().min(1).max(2000),
                        })
                        .parse({ kind: f.get("kind"), message: f.get("message") });
                      const { error } = await supabase
                        .from("privacy_requests")
                        .insert({ ...input, user_id: w.user.id });
                      if (error) throw error;
                      form.reset();
                      toast.success(es ? "Solicitud registrada" : "Request recorded");
                      await refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Error");
                    }
                  }}
                >
                  <label className="block text-sm">
                    {es ? "Tipo de solicitud" : "Request type"}
                    <select name="kind" className="mt-2 w-full rounded-md border bg-background p-3">
                      {[
                        ["access", "Acceso", "Access"],
                        ["correction", "Corrección", "Correction"],
                        ["deletion", "Supresión", "Deletion"],
                        ["revocation", "Revocación", "Revocation"],
                        ["complaint", "Reclamo", "Complaint"],
                      ].map(([v, s, en]) => (
                        <option key={v} value={v}>
                          {es ? s : en}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    {es ? "Mensaje (sin datos sensibles)" : "Message (no sensitive data)"}
                    <textarea
                      name="message"
                      required
                      maxLength={2000}
                      className="mt-2 min-h-28 w-full rounded-md border bg-background p-3"
                    />
                  </label>
                  <Button type="submit">{es ? "Registrar solicitud" : "Submit request"}</Button>
                </form>
                <ul className="mt-7 divide-y">
                  {w.requests.map((r) => (
                    <li key={r.id} className="py-4">
                      <p className="text-sm font-medium">
                        {r.kind} · {new Date(r.created_at).toLocaleString(lang)}
                      </p>
                      <p className="mt-2 break-words text-sm text-muted-foreground">{r.message}</p>
                      <p className="mt-2 text-xs">{r.status}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
        <footer className="mt-12 border-t py-5">
          <LegalLinks />
        </footer>
      </div>
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogTitle>{es ? "Subir factura" : "Upload invoice"}</DialogTitle>
          <DialogDescription>
            {es
              ? "PDF, JPG, PNG o WebP · máximo 10 MB. Se evalúa al subirlo."
              : "PDF, JPG, PNG or WebP · up to 10 MB. Evaluated after upload."}
          </DialogDescription>
          <p className="text-sm text-warning">
            {es
              ? "Solo documentos de prueba sin datos personales reales. Pendiente habilitación legal y operativa."
              : "Test documents without real personal data only. Legal and operational setup pending."}
          </p>
          <form onSubmit={upload} className="space-y-5">
            <label className="block text-sm font-medium">
              {es ? "Foto o archivo" : "Photo or file"}
              <Input
                ref={fileInputRef}
                name="file"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                required
                className="mt-2 h-auto py-3"
              />
            </label>
            <CameraCapture onCapture={putCapturedPhoto} es={es} />
            <label className="flex items-start gap-3 text-sm leading-6">
              <input required type="checkbox" className="mt-1 size-5 shrink-0" />
              {es
                ? "Tengo derecho a compartir el archivo, es una prueba sin datos personales reales y autorizo su almacenamiento y análisis por IA según la política de privacidad."
                : "I have the right to share this test file, it contains no real personal data, and I authorize storage and AI analysis under the privacy policy."}
            </label>
            <LegalLinks />
            <Button disabled={busy} type="submit" className="w-full">
              <Upload />
              {es ? "Subir y evaluar" : "Upload and evaluate"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent>
          <DialogTitle>{es ? "Agregar regla" : "Add rule"}</DialogTitle>
          <DialogDescription>
            {es
              ? "Las reglas de revisión tienen prioridad. Las monedas no se convierten."
              : "Review rules take priority. Currencies are not converted."}
          </DialogDescription>
          <form onSubmit={createRule} className="space-y-4">
            <label className="block text-sm">
              {es ? "Nombre de la regla" : "Rule name"}
              <Input name="label" maxLength={120} required className="mt-2" />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0 text-sm">
                {es ? "Categoría" : "Category"}
                <select name="category" className="mt-2 w-full rounded-md border bg-background p-2">
                  {[
                    ["software", "Software/SaaS"],
                    ["travel", es ? "Viáticos" : "Travel"],
                    ["marketing", "Marketing"],
                    ["other", es ? "Otra" : "Other"],
                    ["unknown", es ? "Proveedor desconocido" : "Unknown vendor"],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                {es ? "Condición" : "Condition"}
                <select
                  name="comparison"
                  className="mt-2 w-full rounded-md border bg-background p-2"
                >
                  <option value="under">{es ? "Menor que" : "Under"}</option>
                  <option value="over">{es ? "Mayor que" : "Over"}</option>
                  <option value="always">{es ? "Siempre" : "Always"}</option>
                </select>
              </label>
              <label className="text-sm">
                {es ? "Monto" : "Amount"}
                <Input
                  name="threshold"
                  type="number"
                  min={0}
                  max={1e12}
                  step="0.01"
                  defaultValue={500}
                  required
                  className="mt-2"
                />
              </label>
              <label className="text-sm">
                {es ? "Moneda" : "Currency"}
                <select name="currency" className="mt-2 w-full rounded-md border bg-background p-2">
                  {["USD", "COP", "EUR", "BRL", "USDC"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              {es ? "Resultado" : "Outcome"}
              <select name="action" className="mt-2 w-full rounded-md border bg-background p-2">
                <option value="review">{es ? "Revisión humana" : "Human review"}</option>
                <option value="approve">{es ? "Aprobar" : "Approve"}</option>
              </select>
            </label>
            <Button disabled={busy} type="submit" className="w-full">
              <Plus />
              {es ? "Guardar regla" : "Save rule"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setPreview("");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle>{inv?.vendor || inv?.file_name || (es ? "Factura" : "Invoice")}</DialogTitle>
          <DialogDescription>
            {inv
              ? `${inv.profiles?.display_name || (es ? "Empleado" : "Employee")} · ${new Date(inv.created_at).toLocaleString(lang)}`
              : ""}
          </DialogDescription>
          {inv && (
            <>
              <div className={cn("grid gap-6", (preview || previewBusy) && "sm:grid-cols-2")}>
                <div>
                  <Stamp
                    key={`${inv.id}-${inv.status}-${inv.security_status}`}
                    tone={invoiceStampTone(inv)}
                    es={es}
                    size="lg"
                    land
                  />
                  <p className="typed mt-5 text-3xl font-bold">
                    {inv.currency}{" "}
                    {inv.amount?.toLocaleString(lang, { minimumFractionDigits: 2 }) ?? "—"}
                  </p>
                  <p
                    className={cn(
                      "mt-3 break-words border-t border-dashed border-input pt-3 text-[15px] leading-relaxed",
                      inv.security_status === "blocked" && "font-semibold text-ink-red",
                    )}
                  >
                    {inv.error_message || (es ? inv.explanation_es : inv.explanation_en)}
                  </p>
                  {inv.security_status === "blocked" && (
                    <BankMismatch comparison={readBankComparison(inv.security_snapshot)} es={es} />
                  )}
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{es ? "Proveedor" : "Supplier"}</dt>
                      <dd className="break-words font-medium">
                        {inv.vendor || (es ? "No identificado" : "Not identified")}
                      </dd>
                      {inv.matched_merchant && (
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {es ? "Comercio reconocido: " : "Recognized merchant: "}
                          {inv.matched_merchant}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {es ? "Número de factura" : "Invoice number"}
                      </dt>
                      <dd className="break-words font-medium">
                        {inv.invoice_number || (es ? "No identificado" : "Not identified")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {es ? "Fecha de emisión" : "Issue date"}
                      </dt>
                      <dd>{inv.invoice_date || (es ? "No identificada" : "Not identified")}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {es ? "Fecha de vencimiento" : "Due date"}
                      </dt>
                      <dd>{inv.due_date || (es ? "No identificada" : "Not identified")}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {es ? "Descripción" : "Description"}
                      </dt>
                      <dd className="break-words">
                        {inv.description || (es ? "No identificada" : "Not identified")}
                      </dd>
                    </div>
                  </dl>
                  <SupplierReferenceLine status={inv.security_status} es={es} />
                  {inv.status === "pending" && inv.user_id === w.user.id && (
                    <Button
                      disabled={busy}
                      className="mt-4 h-auto whitespace-normal"
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const r = await evaluate({ data: { id: inv.id } });
                          if (!r.ok) toast.error(r.message);
                          await refresh();
                          await showInvoice(inv.id);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {es ? "Ejecutar agente WinkWink" : "Run WinkWink agent"}
                    </Button>
                  )}
                  {adminUi && inv.status === "review" && (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {inv.security_status === "blocked" ? (
                        <p className="flex items-start gap-2 text-sm font-semibold text-ink-red">
                          <Lock className="mt-0.5 size-4 shrink-0" />
                          {es
                            ? "Aprobación bloqueada: la cuenta no coincide con la verificada en Blinka."
                            : "Approval locked: the account does not match the one verified in Blinka."}
                        </p>
                      ) : (
                        <Button
                          disabled={busy || inv.security_status !== "passed"}
                          onClick={() => resolve("approved")}
                        >
                          <Check />
                          {es ? "Aprobar" : "Approve"}
                        </Button>
                      )}
                      <Button disabled={busy} variant="outline" onClick={() => resolve("rejected")}>
                        <X />
                        {es ? "Rechazar" : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  {previewBusy ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    preview &&
                    (inv.mime_type === "application/pdf" ? (
                      <div className="grid min-h-48 place-items-center border bg-surface">
                        <FileText className="size-12 text-primary" />
                        <Button asChild variant="outline">
                          <a href={preview} target="_blank" rel="noopener noreferrer">
                            {es ? "Abrir PDF original" : "Open original PDF"}
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={preview}
                        alt={
                          es
                            ? `Factura original: ${inv.file_name}`
                            : `Original invoice: ${inv.file_name}`
                        }
                        className="max-h-80 w-full object-contain"
                      />
                    ))
                  )}
                  {preview && (
                    <Button asChild variant="link" className="mt-2">
                      <a href={preview} target="_blank" rel="noopener noreferrer">
                        <Download />
                        {es ? "Abrir archivo original" : "Open original file"}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              {inv.demo_scenario && (
                <p className="border-t pt-4 text-sm text-muted-foreground">
                  {es
                    ? "Factura sintética: no se llamó a la IA ni a plataformas de pago. La decisión aplica referencias y topes guardados."
                    : "Synthetic invoice: no AI or payment platform calls. The decision applies saved references and caps."}
                </p>
              )}
              <InvoiceDecision usage={inv.ai_usage} decision={inv.decision_snapshot} es={es} />
              <section className="border-t pt-4">
                <h2 className="text-sm font-semibold">
                  {es ? "Registro de decisiones" : "Decision history"}
                </h2>
                <ol className="typed mt-3 space-y-2 text-[13px] leading-relaxed">
                  {events.map((e, i) => (
                    <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                      <span className="text-muted-foreground">
                        {new Date(e.created_at).toLocaleString(lang, {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </span>
                      {es ? e.message_es : e.message_en}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

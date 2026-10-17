import { useState } from "react";
import { Save, Trash2, Loader2, ShieldCheck, ShieldBan, Store } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { merchantSchema, type Merchant } from "@/lib/merchants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { registerSupplierFile } from "@/lib/supplier-files.functions";
import { uploadSupplierReferences, SupplierReferences } from "./supplier-references";
import { TestInvoiceLibrary } from "./test-invoice-library";
import { validateUpload } from "@/lib/invoice-policy";

export function Merchants({
  merchants,
  es,
  refresh,
}: {
  merchants: (Merchant & { id: string })[];
  es: boolean;
  refresh: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [disposition, setDisposition] = useState<"allowed" | "blocked">("allowed");
  const register = useServerFn(registerSupplierFile);
  const [initialInvoices, setInitialInvoices] = useState<File[]>([]);
  const [initialQr, setInitialQr] = useState<File[]>([]);
  const reduced = useReducedMotion();
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const verified = data.get("verified") === "on";
      const files = [
        ...initialInvoices.map((file) => ({ file, kind: "invoice" as const })),
        ...initialQr.map((file) => ({ file, kind: "qr" as const })),
      ];
      if (files.length && data.get("reference_authorized") !== "on")
        throw new Error(
          es
            ? "Autoriza el análisis de documentos sintéticos."
            : "Authorize synthetic document analysis.",
        );
      if (files.some(({ file }) => !validateUpload(file.size, file.type)))
        throw new Error("PDF / JPG / PNG / WEBP · 10 MB");
      const reference_invoice_number =
        String(data.get("reference_invoice_number") || "").trim() || null;
      const invoice_prefix = String(data.get("invoice_prefix") || "").trim() || null;
      const format_notes = String(data.get("format_notes") || "").trim() || null;
      const confirmation_channel = String(data.get("confirmation_channel") || "").trim() || null;
      const bank_name = String(data.get("bank_name") || "").trim() || null;
      const bank_last4 = String(data.get("bank_last4") || "").trim() || null;
      const tax_id = String(data.get("tax_id") || "").trim() || null;
      if (
        verified &&
        (!tax_id ||
          !reference_invoice_number ||
          !invoice_prefix ||
          !format_notes ||
          !confirmation_channel ||
          disposition !== "allowed")
      )
        throw new Error(
          es
            ? "Completa NIT, referencia, prefijo, formato y canal; solo proveedores permitidos pueden confirmarse."
            : "Complete tax ID, reference, prefix, format and channel; only allowed suppliers can be confirmed.",
        );
      const entry = merchantSchema.parse({
        name: data.get("name"),
        disposition,
        aliases: String(data.get("aliases") || "")
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean),
        bank_name,
        bank_last4,
        tax_id,
        verified_at: verified ? new Date().toISOString() : null,
      });
      const { data: supplier, error } = await supabase
        .from("verified_vendors")
        .insert({
          name: entry.name,
          disposition: entry.disposition,
          aliases: entry.aliases,
          bank_name: entry.bank_name ?? null,
          bank_last4: entry.bank_last4 ?? null,
          tax_id: entry.tax_id ?? null,
          verified_at: null,
          reference_invoice_number,
          invoice_prefix,
          format_notes,
          confirmation_channel,
          expected_category: String(data.get("expected_category")),
          expected_currency: String(data.get("expected_currency")),
          trust_confirmed_at: verified && files.length === 0 ? new Date().toISOString() : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      form.reset();
      setInitialInvoices([]);
      setInitialQr([]);
      if (supplier && files.length) {
        try {
          await uploadSupplierReferences(supplier.id, files, register);
        } finally {
          await refresh();
        }
      }
      await refresh();
      toast.success(
        files.length
          ? es
            ? "Proveedor y referencias guardados; revisa los metadatos y confirma el registro."
            : "Supplier and references saved; review metadata and confirm onboarding."
          : es
            ? "Comercio guardado"
            : "Merchant saved",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8"
    >
      <div className="border-b pb-6">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">WinkWink</p>
        <h2 className="text-2xl font-semibold">{es ? "Reglas Activas" : "Active Rules"}</h2>
      </div>
      <TestInvoiceLibrary es={es} />
      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14">
        <form onSubmit={save} className="min-w-0 space-y-6">
          <h3 className="text-lg font-semibold">{es ? "Agregar proveedor" : "Add supplier"}</h3>
          <label className="block text-sm font-medium">
            {es ? "Nombre del proveedor" : "Supplier name"}
            <Input
              name="name"
              required
              maxLength={120}
              placeholder="McDonald's"
              className="mt-2 h-11"
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              {es ? "Política de gasto" : "Spending policy"}
            </legend>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              {(["allowed", "blocked"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  aria-pressed={disposition === value}
                  onClick={() => setDisposition(value)}
                  className={cn(
                    "relative h-11 min-w-0 shadow-none",
                    disposition === value && "bg-background shadow-sm",
                  )}
                >
                  {value === "allowed" ? (
                    <ShieldCheck className="text-success" />
                  ) : (
                    <ShieldBan className="text-destructive" />
                  )}
                  {value === "allowed"
                    ? es
                      ? "Permitido"
                      : "Allowed"
                    : es
                      ? "Bloqueado"
                      : "Blocked"}
                </Button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            {es ? "Alias del proveedor" : "Supplier aliases"}
            <textarea
              name="aliases"
              maxLength={2400}
              placeholder={"Arcos Dorados\nDLO*"}
              className="mt-2 min-h-32 w-full resize-y rounded-md border bg-background p-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <fieldset className="space-y-4 border-t pt-5">
            <legend className="text-sm font-semibold">
              {es ? "Red de confianza · registro inicial" : "Trust registry · onboarding"}
            </legend>
            <label className="block text-sm">
              {es
                ? "Facturas iniciales de referencia · una o varias"
                : "Initial reference invoices · one or more"}
              <input
                type="file"
                multiple
                accept="application/pdf,image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => setInitialInvoices(Array.from(e.target.files ?? []))}
                className="mt-2 block w-full min-w-0 text-xs"
              />
            </label>
            <label className="block text-sm">
              {es ? "Adjuntos QR · Pix / Bre-B" : "QR attachments · Pix / Bre-B"}
              <input
                type="file"
                multiple
                accept="application/pdf,image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => setInitialQr(Array.from(e.target.files ?? []))}
                className="mt-2 block w-full min-w-0 text-xs"
              />
            </label>
            <p className="text-xs leading-5 text-muted-foreground">
              {es
                ? "PDF o imagen · 10 MB por archivo. Por ahora solo se admiten archivos de la biblioteca sintética. QR: referencia visual; otros adjuntos requieren habilitación, no valida claves ni conecta pagos."
                : "PDF or image · 10 MB per file. Only synthetic library files are accepted for now. QR: visual reference; other attachments require enablement, no key verification or payment connection."}
            </p>
            <label className="flex items-start gap-2 text-xs leading-5">
              <input name="reference_authorized" type="checkbox" className="mt-1" />
              {es
                ? "Confirmo que los archivos son sintéticos, sin datos personales ni claves de pago reales, y autorizo su almacenamiento privado y análisis con Lovable AI."
                : "I confirm these are synthetic files, without personal data or real payment keys, and authorize private storage and Lovable AI analysis."}
            </label>
            <label className="block text-sm">
              {es ? "Banco" : "Bank"}
              <Input name="bank_name" maxLength={120} className="mt-2" />
            </label>
            <label className="block text-sm">
              {es ? "Últimos 4 dígitos de la cuenta" : "Last 4 account digits"}
              <Input
                name="bank_last4"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                className="mt-2"
              />
            </label>
            <label className="block text-sm">
              {es ? "NIT / identificación fiscal del proveedor" : "Supplier tax ID"}
              <Input name="tax_id" maxLength={120} className="mt-2" />
            </label>
            <label className="block text-sm">
              {es ? "Número de factura de referencia" : "Reference invoice number"}
              <Input name="reference_invoice_number" maxLength={120} className="mt-2" />
            </label>
            <label className="block text-sm">
              {es ? "Prefijo esperado de factura" : "Expected invoice prefix"}
              <Input name="invoice_prefix" maxLength={60} className="mt-2" placeholder="FAC-" />
            </label>
            <label className="block text-sm">
              {es ? "Formato acordado (sin datos personales)" : "Agreed format (no personal data)"}
              <textarea
                name="format_notes"
                maxLength={1000}
                className="mt-2 min-h-24 w-full rounded-md border bg-background p-3"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                {es ? "Categoría acordada" : "Agreed category"}
                <select
                  name="expected_category"
                  className="mt-2 w-full rounded-md border bg-background p-2"
                >
                  {["software", "travel", "marketing", "other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                {es ? "Moneda acordada" : "Agreed currency"}
                <select
                  name="expected_currency"
                  className="mt-2 w-full rounded-md border bg-background p-2"
                >
                  {["USD", "COP", "EUR", "BRL", "USDC"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              {es ? "Canal independiente de confirmación" : "Independent confirmation channel"}
              <select
                name="confirmation_channel"
                className="mt-2 w-full rounded-md border bg-background p-2"
              >
                <option value="">—</option>
                <option value="contract">
                  {es ? "Contrato previamente acordado" : "Existing contract"}
                </option>
                <option value="known_contact">
                  {es ? "Contacto previamente conocido" : "Previously known contact"}
                </option>
                <option value="in_person">
                  {es ? "Confirmación presencial" : "In-person confirmation"}
                </option>
              </select>
            </label>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                name="verified"
                type="checkbox"
                disabled={initialInvoices.length + initialQr.length > 0}
                className="mt-1 size-4 shrink-0"
              />
              {initialInvoices.length + initialQr.length > 0
                ? es
                  ? "Con archivos adjuntos, confirma el registro después de revisar los metadatos extraídos."
                  : "With attachments, confirm onboarding after reviewing extracted metadata."
                : es
                  ? "Finanzas confirma los datos y la referencia por el canal indicado. Habilita decisiones automáticas sujetas a reglas, no pagos ni certificación de identidad."
                  : "Finance confirms the details and reference independently. Enables rule-controlled automatic decisions, not payments or identity certification."}
            </label>
          </fieldset>
          <Button type="submit" disabled={busy} className="h-11 w-full">
            {busy ? <Loader2 className="animate-spin" /> : <Save />}
            {busy ? (es ? "Guardando…" : "Saving…") : es ? "Guardar proveedor" : "Save supplier"}
          </Button>
        </form>
        <div className="min-w-0 space-y-8">
          {(["allowed", "blocked"] as const).map((value) => {
            const entries = merchants.filter((m) => m.disposition === value);
            const Icon = value === "allowed" ? ShieldCheck : ShieldBan;
            return (
              <section key={value} className="min-w-0">
                <div className="flex items-center gap-3 border-b pb-4">
                  <Icon
                    className={cn(
                      "size-5",
                      value === "allowed" ? "text-success" : "text-destructive",
                    )}
                  />
                  <h3 className="flex-1 font-semibold">
                    {value === "allowed"
                      ? es
                        ? "Proveedores permitidos"
                        : "Allowed suppliers"
                      : es
                        ? "Proveedores bloqueados"
                        : "Blocked suppliers"}
                  </h3>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {entries.length}
                  </span>
                </div>
                {entries.length === 0 && (
                  <div className="flex items-center gap-3 py-7 text-muted-foreground">
                    <Store className="size-5 shrink-0" />
                    <p className="text-sm">
                      {es ? "Sin proveedores registrados" : "No suppliers registered"}
                    </p>
                  </div>
                )}
                <ul className="divide-y">
                  <AnimatePresence initial={false}>
                    {entries.map((m) => (
                      <motion.li
                        key={m.id}
                        initial={reduced ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-start justify-between gap-3 py-5"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-medium">
                            {m.name}
                            {m.trust_confirmed_at && (
                              <ShieldCheck
                                aria-label={
                                  es
                                    ? "Datos confirmados por administración"
                                    : "Admin-confirmed details"
                                }
                                className="ml-2 inline size-4 text-success"
                              />
                            )}
                          </p>
                          {m.bank_name && (
                            <p className="mt-2 break-words text-sm">
                              {m.bank_name} ****{m.bank_last4 || "????"}
                            </p>
                          )}
                          {m.tax_id && (
                            <p className="mt-1 break-words text-sm text-muted-foreground">
                              {es ? "ID fiscal" : "Tax ID"}: {m.tax_id}
                            </p>
                          )}
                          <p className="mt-2 text-sm">
                            {m.trust_confirmed_at
                              ? es
                                ? "Confirmado por finanzas"
                                : "Finance confirmed"
                              : es
                                ? "Registro pendiente"
                                : "Pending onboarding"}
                          </p>
                          {m.reference_invoice_number && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {m.reference_invoice_number} · {m.invoice_prefix} ·{" "}
                              {m.expected_currency}
                            </p>
                          )}
                          {!m.trust_confirmed_at &&
                            m.disposition === "allowed" &&
                            m.reference_invoice_number && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-3"
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from("verified_vendors")
                                      .update({ trust_confirmed_at: new Date().toISOString() })
                                      .eq("id", m.id);
                                    if (error) throw error;
                                    await refresh();
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : "Error");
                                  }
                                }}
                              >
                                {es ? "Confirmar registro" : "Confirm onboarding"}
                              </Button>
                            )}
                          {m.aliases.length > 0 && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {es ? "Alias" : "Aliases"}
                            </p>
                          )}
                          {m.aliases.map((a) => (
                            <p key={a} className="mt-1 break-words text-sm text-muted-foreground">
                              {a}
                            </p>
                          ))}
                          <SupplierReferences vendorId={m.id} es={es} refresh={refresh} />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busy}
                          title={es ? "Eliminar proveedor" : "Delete supplier"}
                          aria-label={`${es ? "Eliminar proveedor" : "Delete supplier"}: ${m.name}`}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const { error } = await supabase
                                .from("verified_vendors")
                                .delete()
                                .eq("id", m.id);
                              if (error) throw error;
                              await refresh();
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Error");
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

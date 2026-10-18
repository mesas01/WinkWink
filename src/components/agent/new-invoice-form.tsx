import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export interface NewInvoicePayload {
  title: string;
  text: string | null;
  file: { name: string; mimeType: string; base64: string } | null;
}

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Submit a synthetic invoice as pasted text or as a PDF/image read by Gemini. */
export function NewInvoiceForm({
  es,
  geminiReady,
  onSubmit,
  busy,
}: {
  es: boolean;
  geminiReady: boolean;
  onSubmit: (p: NewInvoicePayload) => void;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (file && (!TYPES.includes(file.type) || file.size > MAX_BYTES)) {
      toast.error(
        es
          ? "Usa un PDF, PNG, JPG o WebP de hasta 8 MB."
          : "Use a PDF, PNG, JPG or WebP up to 8 MB.",
      );
      return;
    }
    if (!file && !text.trim()) return;
    const payload: NewInvoicePayload = {
      title: file?.name ?? text.trim().split("\n")[0]?.slice(0, 60) ?? "Factura",
      text: text.trim() || null,
      file: file ? { name: file.name, mimeType: file.type, base64: await toBase64(file) } : null,
    };
    onSubmit(payload);
    setText("");
    setFile(null);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-y-2 border-rule py-4">
      <label className="text-sm font-semibold" htmlFor="invoice-text">
        {es ? "Texto de la factura" : "Invoice text"}
      </label>
      <Textarea
        id="invoice-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={
          es
            ? "Proveedor: AWS\nTotal: USD 150.00\nCuenta bancaria: Chase ****4321"
            : "Vendor: AWS\nTotal: USD 150.00\nBank account: Chase ****4321"
        }
        className="typed text-[13px]"
      />
      <label className="text-sm font-semibold" htmlFor="invoice-file">
        {es ? "o un PDF / imagen" : "or a PDF / image"}
        {!geminiReady && (
          <span className="ml-2 font-normal text-muted-foreground">
            {es ? "(requiere GEMINI_API_KEY)" : "(requires GEMINI_API_KEY)"}
          </span>
        )}
      </label>
      <Input
        id="invoice-file"
        type="file"
        accept={TYPES.join(",")}
        disabled={!geminiReady}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="h-auto py-2"
      />
      <p className="text-xs text-muted-foreground">
        {es
          ? "Solo documentos de prueba sin datos reales."
          : "Test documents without real data only."}
      </p>
      <Button
        type="submit"
        disabled={busy || (!file && !text.trim())}
        className="justify-self-start"
      >
        <Upload />
        {es ? "Enviar y evaluar" : "Submit and evaluate"}
      </Button>
    </form>
  );
}

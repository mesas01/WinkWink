import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { BankComparison } from "@/lib/security-view";
import { cn } from "@/lib/utils";

/** Invoice account vs Blinka-verified account, shown only on a security block. */
export function BankMismatch({
  comparison,
  es,
}: {
  comparison: BankComparison | null;
  es: boolean;
}) {
  if (!comparison) return null;
  return (
    <dl className="typed mt-4 border-y-2 border-ink-red text-sm">
      <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 border-b border-dashed border-input py-2">
        <dt className="text-muted-foreground">{es ? "En la factura" : "On the invoice"}</dt>
        <dd className="font-bold text-ink-red line-through decoration-2">
          {comparison.invoiceAccount}
        </dd>
      </div>
      <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-2">
        <dt className="text-muted-foreground">
          {es ? "Verificada en Blinka" : "Verified in Blinka"}
        </dt>
        <dd className="font-bold">{comparison.verifiedAccount}</dd>
      </div>
    </dl>
  );
}

const REFERENCE_COPY = {
  passed: {
    es: "Cuenta y referencia del proveedor verificadas",
    en: "Supplier account and reference verified",
  },
  blocked: {
    es: "La cuenta bancaria no coincide con la verificada en Blinka",
    en: "Bank account does not match the one verified in Blinka",
  },
  review: {
    es: "Referencia del proveedor pendiente de revisión",
    en: "Supplier reference needs review",
  },
};

export function SupplierReferenceLine({ status, es }: { status: string | null; es: boolean }) {
  // On a block, the reason, the account comparison and the locked note already say it.
  if (status === "blocked") return null;
  const key = status === "passed" ? "passed" : status === "blocked" ? "blocked" : "review";
  const Icon = key === "passed" ? ShieldCheck : key === "blocked" ? ShieldAlert : ShieldQuestion;
  return (
    <p
      className={cn(
        "mt-4 flex items-center gap-2 text-sm font-semibold",
        key === "blocked" ? "text-ink-red" : "text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", key !== "blocked" && "text-muted-foreground")} />
      {es ? REFERENCE_COPY[key].es : REFERENCE_COPY[key].en}
    </p>
  );
}

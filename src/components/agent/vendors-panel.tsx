import { useAgentStore } from "@/stores/agent-store";

/** Admin only. Pre-verified vendor references the anti-fraud step compares against. */
export function VendorsPanel({ es }: { es: boolean }) {
  const vendors = useAgentStore((s) => s.vendors);
  return (
    <section>
      <p className="max-w-2xl text-sm text-muted-foreground">
        {es
          ? "Cuentas y Tax ID verificados en Blinka (datos sintéticos). Si la cuenta de una factura no coincide, el pago se bloquea."
          : "Accounts and Tax IDs verified in Blinka (synthetic data). If an invoice's account does not match, the payment is blocked."}
      </p>
      <div className="mt-5 overflow-x-auto surface-group">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="px-3 py-2">{es ? "Proveedor" : "Vendor"}</th>
              <th className="px-3 py-2">{es ? "Cuenta verificada" : "Verified account"}</th>
              <th className="px-3 py-2">Tax ID / NIT</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-hairline last:border-b-0">
                <td className="px-3 py-3 font-semibold">{v.name}</td>
                <td className="typed px-3 py-3 font-bold">{v.bankAccount}</td>
                <td className="typed px-3 py-3">{v.taxId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

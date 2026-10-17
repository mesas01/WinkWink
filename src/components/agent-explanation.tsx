export function AgentExplanation({ es }: { es: boolean }) {
  const steps = es
    ? [
        [
          "1. Finanzas establece la confianza",
          "Registra el NIT, un número de factura de referencia, prefijo, categoría, moneda y formato acordado. Confirma por un canal independiente. No se verifica identidad empresarial ni se certifica ausencia de fraude.",
        ],
        [
          "2. La IA lee el documento",
          "Una llamada a Lovable AI con openai/gpt-6-astra extrae campos visibles, incluida la fecha de vencimiento. No entrenamos un modelo por proveedor. Las referencias las compara un motor de reglas, no el modelo.",
        ],
        [
          "3. Las reglas deciden",
          "Se contrastan proveedor, NIT, prefijo, categoría y moneda. Datos faltantes o cambios escalan a finanzas. Las notas de formato sirven a la revisión humana; no prueban autenticidad visual.",
        ],
        [
          "4. El presupuesto se reserva",
          "Las aprobaciones se contabilizan juntas de forma atómica por moneda y periodo. Una aprobación manual puede superar el umbral de revisión, nunca el máximo por factura o periodo.",
        ],
        [
          "5. Queda un registro",
          "Se guardan referencias, reglas, acumulados, decisión, fecha y explicación. Aprobar significa ejecución simulada; WinkWink no envía dinero.",
        ],
      ]
    : [
        [
          "1. Finance establishes trust",
          "Register tax ID, reference invoice number, prefix, category, currency and agreed format. Confirm independently. This is not business identity verification or fraud certification.",
        ],
        [
          "2. AI reads the document",
          "One Lovable AI call using openai/gpt-6-astra extracts visible fields including the due date. No supplier-specific model training. A rule engine compares references.",
        ],
        [
          "3. Rules decide",
          "Supplier, tax ID, prefix, category and currency are compared. Missing or changed data escalates. Format notes support human review; they do not prove visual authenticity.",
        ],
        [
          "4. Budget is reserved",
          "Approvals are counted atomically per currency and calendar period. Manual approval can exceed the review threshold, not hard payment or period limits.",
        ],
        [
          "5. Decisions are recorded",
          "References, rules, reserved totals, timestamps and reasons are recorded. Approval is simulated execution; WinkWink does not transfer money.",
        ],
      ];
  return (
    <section className="mt-8 max-w-3xl">
      <h2 className="text-2xl font-semibold">
        {es ? "Cómo decide el agente" : "How the agent decides"}
      </h2>
      <ol className="mt-6 divide-y border-y">
        {steps.map(([title, body]) => (
          <li key={title} className="py-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
      <h3 className="mt-8 text-lg font-semibold">
        {es ? "Tokens, llamadas y costos" : "Tokens, calls & costs"}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {es
          ? "La clave de acceso la administra Lovable y permanece privada en el servidor. No proviene de Google ni de Blinka. Los tokens son unidades de contenido procesado y generado por el modelo, no criptomonedas. La lectura usa una llamada por evaluación; comparar referencias y calcular presupuestos no consume llamadas de IA. El consumo informado por el proveedor aparece en la factura. Las solicitudes consumen créditos de IA del espacio de trabajo; el total de tokens no es el precio cobrado. Consulta los cargos en Lovable → Settings → Plans & credits. No se inventa un costo por factura."
          : "Lovable manages the access key privately on the server; it does not come from Google or Blinka. Tokens are model input/output units, not cryptocurrency. Extraction uses one call per evaluation; reference matching and budgets do not call AI. Provider-reported usage appears on the invoice. Requests consume workspace AI credits; token counts are not the billed price. Check charges in Lovable → Settings → Plans & credits. No invoice cost is fabricated."}
      </p>
      <p className="mt-6 text-sm text-warning">
        {es
          ? "Solo documentos sintéticos hasta completar los datos legales y operativos. Pix, Bre-B y USDC no están conectados."
          : "Synthetic documents only pending legal and operational setup. Pix, Bre-B and USDC are not connected."}
      </p>
    </section>
  );
}

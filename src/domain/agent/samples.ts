/** Synthetic invoices for the demo. Plain text as an OCR step would see it. No real data. */
export interface SampleInvoice {
  id: string;
  submittedBy: string;
  title: string;
  text: string;
}

export const EMPLOYEES = ["Laura Gómez", "Andrés Ruiz", "Camila Torres"] as const;
export type EmployeeName = (typeof EMPLOYEES)[number];
export const ADMIN_NAME = "Valentina Ríos";

const invoice = (lines: string[]) => lines.join("\n");

export const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    id: "INV-001",
    submittedBy: "Laura Gómez",
    title: "AWS · infraestructura octubre",
    text: invoice([
      "Amazon Web Services, Inc.",
      "Proveedor: AWS",
      "Factura No: INV-001",
      "Categoría: Software / infraestructura en la nube",
      "Total: USD 150.00",
      "Moneda: USD",
      "Vence: 2026-10-31",
      "Tax ID: US-998822",
      "Cuenta bancaria: Chase ****4321",
    ]),
  },
  {
    id: "INV-002",
    submittedBy: "Andrés Ruiz",
    title: "Uber · traslados a cliente en Medellín",
    text: invoice([
      "Uber Technologies",
      "Proveedor: Uber",
      "Factura No: INV-002",
      "Categoría: Viáticos",
      "Total: USD 120.00",
      "Moneda: USD",
      "Vence: 2026-10-20",
      "NIT: CO-900155107",
      "Cuenta bancaria: Bancolombia ****1200",
    ]),
  },
  {
    id: "INV-003",
    submittedBy: "Camila Torres",
    title: "AWS · factura con cuenta alterada",
    text: invoice([
      "Amazon Web Services, Inc.",
      "Proveedor: AWS",
      "Factura No: INV-003",
      "Categoría: Software",
      "Total: USD 150.00",
      "Moneda: USD",
      "Vence: 2026-10-31",
      "Tax ID: US-998822",
      "AVISO: actualizamos nuestros datos de pago.",
      "Cuenta bancaria: Wells Fargo ****9999",
    ]),
  },
  {
    id: "INV-004",
    submittedBy: "Laura Gómez",
    title: "Slack · licencias del equipo",
    text: invoice([
      "Slack Technologies",
      "Proveedor: Slack",
      "Factura No: INV-004",
      "Categoría: Software",
      "Total: USD 45.00",
      "Moneda: USD",
      "Vence: 2026-11-05",
      "Tax ID: US-554310",
      "Cuenta bancaria: Bank of America ****4500",
    ]),
  },
  {
    id: "INV-005",
    submittedBy: "Camila Torres",
    title: "Agencia desconocida · diseño",
    text: invoice([
      "Pixel Norte Studio SAS",
      "Proveedor: Pixel Norte Studio",
      "Factura No: PN-2210",
      "Categoría: Marketing",
      "Total: USD 2,000.00",
      "Moneda: USD",
      "Vence: 2026-10-25",
      "NIT: CO-901443210",
      "Cuenta bancaria: Davivienda ****3301",
    ]),
  },
  {
    id: "INV-006",
    submittedBy: "Andrés Ruiz",
    title: "Uber · taxi aeropuerto",
    text: invoice([
      "Uber Technologies",
      "Proveedor: Uber",
      "Factura No: INV-006",
      "Categoría: Viáticos",
      "Total: USD 38.50",
      "Moneda: USD",
      "Vence: 2026-10-22",
      "NIT: CO-900155107",
      "Cuenta bancaria: Bancolombia ****1200",
    ]),
  },
];

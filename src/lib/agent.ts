export type Category = "software" | "travel" | "marketing";
export type Status = "pending" | "paid" | "review" | "override" | "rejected" | "security";
export type RuleId = "saas" | "travel" | "unknown";

export interface Invoice {
  id: string;
  vendor: string;
  knownVendor: boolean;
  bankName: string;
  bankLast4: string;
  taxId: string;
  verifiedBank: string;
  verifiedTaxId: string;
  category: Category;
  amount: number;
  date: string;
  submittedBy: string;
  desc: { es: string; en: string };
}

export type LogKey =
  | { key: "approvedSaas"; amount: number }
  | { key: "haltTravel"; amount: number }
  | { key: "haltUnknown"; vendor: string }
  | { key: "haltNoRule"; amount: number }
  | { key: "override" }
  | { key: "rejected" }
  | { key: "security"; bank: string; registered: string };

export interface Decision {
  status: "paid" | "review" | "security";
  log: LogKey;
}

export const SAAS_LIMIT = 500;
export const TRAVEL_LIMIT = 100;

export function evaluate(inv: Invoice, rules: Record<RuleId, boolean>): Decision {
  if (
    inv.knownVendor &&
    (`${inv.bankName} ****${inv.bankLast4}` !== inv.verifiedBank || inv.taxId !== inv.verifiedTaxId)
  )
    return {
      status: "security",
      log: {
        key: "security",
        bank: `${inv.bankName} ****${inv.bankLast4}`,
        registered: inv.verifiedBank,
      },
    };
  if (rules.unknown && !inv.knownVendor)
    return { status: "review", log: { key: "haltUnknown", vendor: inv.vendor } };
  if (rules.travel && inv.category === "travel" && inv.amount > TRAVEL_LIMIT)
    return { status: "review", log: { key: "haltTravel", amount: inv.amount } };
  if (rules.saas && inv.category === "software" && inv.amount < SAAS_LIMIT)
    return { status: "paid", log: { key: "approvedSaas", amount: inv.amount } };
  return { status: "review", log: { key: "haltNoRule", amount: inv.amount } };
}

export const INVOICES: Invoice[] = [
  {
    id: "INV-001",
    vendor: "AWS",
    knownVendor: true,
    bankName: "Chase",
    bankLast4: "4321",
    taxId: "US-998822",
    verifiedBank: "Chase ****4321",
    verifiedTaxId: "US-998822",
    category: "software",
    amount: 150,
    date: "2026-10-12",
    submittedBy: "Laura Gómez",
    desc: { es: "Infraestructura en la nube — octubre", en: "Cloud infrastructure — October" },
  },
  {
    id: "INV-002",
    vendor: "Uber",
    knownVendor: true,
    bankName: "Demo Bank",
    bankLast4: "1200",
    taxId: "DEMO-UBER",
    verifiedBank: "Demo Bank ****1200",
    verifiedTaxId: "DEMO-UBER",
    category: "travel",
    amount: 120,
    date: "2026-10-13",
    submittedBy: "Andrés Ruiz",
    desc: {
      es: "Traslados a reunión con cliente en Medellín",
      en: "Rides to client meeting in Medellín",
    },
  },
  {
    id: "INV-003",
    vendor: "AWS",
    knownVendor: true,
    bankName: "Wells Fargo",
    bankLast4: "9999",
    taxId: "US-998822",
    verifiedBank: "Chase ****4321",
    verifiedTaxId: "US-998822",
    category: "software",
    amount: 150,
    date: "2026-10-14",
    submittedBy: "Camila Torres",
    desc: {
      es: "Factura adulterada — prueba sintética",
      en: "Adulterated invoice — synthetic test",
    },
  },
  {
    id: "INV-004",
    vendor: "Slack",
    knownVendor: true,
    bankName: "Demo Bank",
    bankLast4: "4500",
    taxId: "DEMO-SLACK",
    verifiedBank: "Demo Bank ****4500",
    verifiedTaxId: "DEMO-SLACK",
    category: "software",
    amount: 45,
    date: "2026-10-15",
    submittedBy: "Laura Gómez",
    desc: { es: "Licencias de mensajería del equipo", en: "Team messaging licenses" },
  },
  {
    id: "INV-005",
    vendor: "Figma",
    knownVendor: true,
    bankName: "Demo Bank",
    bankLast4: "7500",
    taxId: "DEMO-FIGMA",
    verifiedBank: "Demo Bank ****7500",
    verifiedTaxId: "DEMO-FIGMA",
    category: "software",
    amount: 75,
    date: "2026-10-16",
    submittedBy: "Camila Torres",
    desc: { es: "Plan Professional de diseño", en: "Professional design plan" },
  },
];

import { scanSecurity, type VerifiedCredentials } from "./security";
import { decideInvoice, type ExtractedInvoice, type PaymentRule } from "./invoice-policy";

// Synthetic, isolated fixtures. Never inserted into invoices, suppliers, audit history or spend metrics.
export const DEMO_VENDORS: Record<string, VerifiedCredentials> = {
  AWS: { bankName: "Chase", bankLast4: "4321", taxId: "US-998822", verified: true },
  Uber: { bankName: "Demo Bank", bankLast4: "1200", taxId: "DEMO-UBER", verified: true },
};
export const DEMO_INVOICES = [
  {
    number: "INV-001",
    vendor: "AWS",
    amount: 150,
    category: "software",
    bankName: "Chase",
    bankLast4: "4321",
    taxId: "US-998822",
  },
  {
    number: "INV-002",
    vendor: "Uber",
    amount: 120,
    category: "travel",
    bankName: "Demo Bank",
    bankLast4: "1200",
    taxId: "DEMO-UBER",
  },
  {
    number: "INV-003",
    vendor: "AWS",
    amount: 150,
    category: "software",
    bankName: "Wells Fargo",
    bankLast4: "9999",
    taxId: "US-998822",
  },
  {
    number: "INV-004",
    vendor: "Unknown supplier",
    amount: 2000,
    category: "marketing",
    bankName: null,
    bankLast4: null,
    taxId: null,
  },
  {
    number: "INV-005",
    vendor: "AWS",
    amount: 150,
    category: "software",
    bankName: "Chase",
    bankLast4: "4321",
    taxId: "US-998822",
    duplicate: true,
  },
] as const;
export function runSecurityDemo(number: string) {
  const demo = DEMO_INVOICES.find((i) => i.number === number);
  if (!demo) throw new Error("Unknown test invoice");
  const security = scanSecurity(
    demo,
    DEMO_VENDORS[demo.vendor] ?? null,
    "duplicate" in demo && demo.duplicate,
  );
  const rules: PaymentRule[] = [
    {
      id: "saas",
      label: "Software < USD 500",
      category: "software",
      comparison: "under",
      threshold: 500,
      currency: "USD",
      action: "approve",
      enabled: true,
    },
    {
      id: "travel",
      label: "Travel > USD 100",
      category: "travel",
      comparison: "over",
      threshold: 100,
      currency: "USD",
      action: "review",
      enabled: true,
    },
  ];
  const invoice: ExtractedInvoice = {
    isInvoice: true,
    vendor: demo.vendor,
    invoiceNumber: demo.number,
    amount: demo.amount,
    category: demo.category,
    currency: "USD",
    date: "2026-10-17",
    description: "Synthetic test",
    uncertain: false,
  };
  const decision =
    security.status === "passed"
      ? decideInvoice(invoice, rules, true)
      : {
          status: security.status === "blocked" ? ("rejected" as const) : ("review" as const),
          es: security.es,
          en: security.en,
        };
  return { security, decision };
}

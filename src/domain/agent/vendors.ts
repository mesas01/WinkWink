import type { VerifiedVendor } from "./types";

/** Pre-verified vendor references held in Blinka. Synthetic demo data. */
export const VERIFIED_VENDORS: VerifiedVendor[] = [
  {
    id: "aws",
    name: "AWS",
    aliases: ["amazon web services", "aws"],
    bankAccount: "Chase ****4321",
    taxId: "US-998822",
  },
  {
    id: "slack",
    name: "Slack",
    aliases: ["slack technologies", "slack"],
    bankAccount: "Bank of America ****4500",
    taxId: "US-554310",
  },
  {
    id: "figma",
    name: "Figma",
    aliases: ["figma inc", "figma"],
    bankAccount: "Silicon Valley Bank ****7500",
    taxId: "US-771204",
  },
  {
    id: "uber",
    name: "Uber",
    aliases: ["uber technologies", "uber"],
    bankAccount: "Bancolombia ****1200",
    taxId: "CO-900155107",
  },
  {
    id: "rappi",
    name: "Rappi",
    aliases: ["rappi brasil", "rappi"],
    bankAccount: "Itaú ****8810",
    taxId: "BR-26900161",
  },
];

const normalizeName = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Exact match on the canonical name or an alias, after normalization. No fuzzy guessing. */
export function findVerifiedVendor(
  vendorName: string | null,
  vendors: VerifiedVendor[],
): VerifiedVendor | null {
  if (!vendorName) return null;
  const needle = normalizeName(vendorName);
  return (
    vendors.find(
      (v) => normalizeName(v.name) === needle || v.aliases.some((a) => normalizeName(a) === needle),
    ) ?? null
  );
}

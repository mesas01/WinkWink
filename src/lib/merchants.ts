import { z } from 'zod';

const alias = z.string().trim().min(2).max(120).refine(v => !v.includes('*') || (v.endsWith('*') && v.indexOf('*') === v.length - 1 && v.slice(0, -1).trim().length >= 3), 'Use * only at the end of a prefix of at least 3 characters.');
export const merchantSchema = z.object({ name: z.string().trim().min(1).max(120), disposition: z.enum(['allowed', 'blocked']), aliases: z.array(alias).max(20), bank_name: z.string().trim().min(1).max(120).nullable().optional(), bank_last4: z.string().regex(/^\d{4}$/).nullable().optional(), tax_id: z.string().trim().min(1).max(120).nullable().optional(), verified_at: z.string().nullable().optional(), trust_confirmed_at: z.string().nullable().optional(), reference_invoice_number: z.string().nullable().optional(), invoice_prefix: z.string().nullable().optional(), expected_currency: z.string().nullable().optional() });
export type Merchant = z.infer<typeof merchantSchema>;
export type MerchantMatch = { disposition: 'allowed' | 'blocked' | 'unknown' | 'ambiguous'; name: string | null };
export function normalizeMerchant(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/\s+/g, ' ').trim();
}
export function matchMerchant(vendor: string | null, merchants: Merchant[]): MerchantMatch {
  if (!vendor?.trim()) return { disposition: 'unknown', name: null };
  const value = normalizeMerchant(vendor);
  const matches = merchants.filter(m => [m.name, ...m.aliases].some(a => a.endsWith('*') ? value.startsWith(normalizeMerchant(a.slice(0, -1))) : value === normalizeMerchant(a)));
  if (matches.length > 1) return { disposition: 'ambiguous', name: null };
  const match = matches[0];
  return match ? { disposition: match.disposition, name: match.name } : { disposition: 'unknown', name: null };
}
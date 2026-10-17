import { z } from 'zod';
import type { MerchantMatch } from './merchants';

export const POLICY_VERSION = '2026-10-17';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
// Real personal documents remain disabled until operator contacts, retention and processor arrangements are verified.
export const REAL_UPLOADS_ENABLED = false;
export const ruleSchema = z.object({
  label: z.string().trim().min(1).max(120),
  category: z.enum(['software', 'travel', 'marketing', 'other', 'unknown']),
  comparison: z.enum(['under', 'over', 'always']),
  threshold: z.number().finite().min(0).max(1e12),
  currency: z.enum(['USD', 'COP', 'EUR', 'BRL', 'USDC']),
  action: z.enum(['approve', 'review']),
  enabled: z.boolean(),
});
export type PaymentRule = z.infer<typeof ruleSchema> & { id: string };
export const extractionSchema = z.object({
  isInvoice: z.boolean(), vendor: z.string().nullable(), invoiceNumber: z.string().nullable(),
  category: z.enum(['software', 'travel', 'marketing', 'other']).nullable(),
  amount: z.number().nullable(), currency: z.string().nullable(),
  date: z.string().nullable(), description: z.string().nullable(),
  uncertain: z.boolean(),
});
export type ExtractedInvoice = z.infer<typeof extractionSchema>;
export const securityExtractionSchema = extractionSchema.extend({ bankName: z.string().nullable(), bankLast4: z.string().nullable(), taxId: z.string().nullable(), dueDate: z.string().nullable() });

export function validateUpload(size: number, mime: string) {
  return size > 0 && size <= MAX_FILE_BYTES && MIME_TYPES.some((t) => t === mime);
}

export function decideInvoice(inv: ExtractedInvoice, rules: PaymentRule[], knownVendor: boolean, merchant?: MerchantMatch) {
  if (merchant?.disposition === 'ambiguous') return { status: 'review' as const, es: 'Alias de comercio ambiguo. Revisión humana necesaria.', en: 'Ambiguous merchant alias. Human review required.' };
  if (merchant?.disposition === 'blocked') return { status: 'rejected' as const, es: `Comercio bloqueado: ${merchant.name}. No se ejecutó ningún pago.`, en: `Blocked merchant: ${merchant.name}. No payment was executed.` };
  if (!inv.isInvoice || inv.uncertain || !inv.vendor?.trim() || !inv.invoiceNumber?.trim() || !inv.date?.trim() || !inv.description?.trim() || inv.amount === null || inv.amount < 0 || !inv.currency || !inv.category) {
    return { status: 'review' as const, es: 'Datos incompletos o inciertos. Revisión humana necesaria.', en: 'Incomplete or uncertain data. Human review required.' };
  }
  const matches = rules.filter((r) => r.enabled &&
    (r.category === 'unknown' ? !knownVendor : r.category === inv.category) &&
    r.currency === inv.currency && (r.comparison === 'always' || (r.comparison === 'under' ? inv.amount !== null && inv.amount < r.threshold : inv.amount !== null && inv.amount > r.threshold)));
  const review = matches.find((r) => r.action === 'review');
  const approval = matches.find((r) => r.action === 'approve' && knownVendor);
  if (review) return { status: 'review' as const, es: `Revisión requerida por la regla: ${review.label}.`, en: `Review required by rule: ${review.label}.` };
  if (approval) return { status: 'approved' as const, es: `Aprobada por la regla: ${approval.label}. No se ejecutó ningún pago.`, en: `Approved by rule: ${approval.label}. No payment was executed.` };
  return { status: 'review' as const, es: knownVendor ? 'Ninguna regla autoriza la aprobación. Revisión humana necesaria.' : 'Proveedor sin verificar. Revisión humana necesaria.', en: knownVendor ? 'No rule authorizes approval. Human review required.' : 'Unverified vendor. Human review required.' };
}
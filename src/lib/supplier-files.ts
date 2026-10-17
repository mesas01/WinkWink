import { z } from 'zod';
import { normalizeMerchant } from './merchants';
import { validateUpload } from './invoice-policy';

export const referenceUploadSchema = z.object({ vendorId: z.string().uuid(), path: z.string().max(500), name: z.string().min(1).max(200), mime: z.enum(['application/pdf','image/png','image/jpeg','image/webp']), kind: z.enum(['invoice','qr']), authorizedTest: z.literal(true) });
export const referenceFieldsSchema = z.object({ isInvoice: z.boolean(), vendor: z.string().nullable(), taxId: z.string().nullable(), invoiceNumber: z.string().nullable(), category: z.enum(['software','travel','marketing','other']).nullable(), currency: z.string().nullable(), bankName: z.string().nullable(), bankLast4: z.string().nullable(), uncertain: z.boolean() });
export type ReferenceFields = z.infer<typeof referenceFieldsSchema>;
export function validReferenceFile(size: number, mime: string, bytes: Uint8Array) {
  if (!validateUpload(size,mime)) return false;
  const ascii = (start:number,end:number) => String.fromCharCode(...bytes.slice(start,end));
  return mime==='application/pdf' ? ascii(0,4)==='%PDF' : mime==='image/png' ? bytes[0]===137 && ascii(1,4)==='PNG' : mime==='image/jpeg' ? bytes[0]===255 && bytes[1]===216 : mime==='image/webp' && ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP';
}
export function compareReferenceFiles(invoice: {taxId:string|null;invoiceNumber:string|null;category:string|null;currency:string|null;bankName?:string|null;bankLast4?:string|null}, files: {id:string;kind:string;status:string;metadata:unknown}[]) {
  if (!files.length) return { passed:true, reason:'manual_reference', referenceIds:[] as string[] };
  if(files.some(f=>f.status!=='ready')) return {passed:false,reason:'reference_files_pending',referenceIds:[] as string[]};
  const references=files.filter(f=>f.kind==='invoice');
  if(!references.length) return {passed:true,reason:'qr_reference_only',referenceIds:[] as string[]};
  const normalize=(s:string)=>normalizeMerchant(s).replace(/[\s-]/g,'');
  const matched=references.filter(f=>{
    const parsed=referenceFieldsSchema.safeParse(f.metadata); if(!parsed.success) return false; const r=parsed.data;
    const prefix=r.invoiceNumber?.match(/^.*?[^0-9](?=[0-9]+$)/)?.[0];
    if(r.uncertain || !r.isInvoice || !r.taxId || !invoice.taxId || normalize(r.taxId)!==normalize(invoice.taxId) || !prefix || !invoice.invoiceNumber?.toUpperCase().startsWith(prefix.toUpperCase()) || invoice.currency!==r.currency || invoice.category!==r.category) return false;
    if(r.bankName && (!invoice.bankName || normalize(r.bankName)!==normalize(invoice.bankName)))return false;
    if(r.bankLast4 && invoice.bankLast4!==r.bankLast4)return false;
    return true;
  });
  return {passed:matched.length>0,reason:matched.length?'uploaded_reference_matches':'uploaded_reference_mismatch',referenceIds:matched.map(f=>f.id)};
}
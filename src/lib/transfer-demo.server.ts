import type { Database } from '@/integrations/supabase/types';
import { decideInvoice, ruleSchema } from './invoice-policy';
import { matchMerchant } from './merchants';
import { checkSupplierReference, completeInvoiceReference } from './trust';

// Authorization is checked by the caller-scoped function before this privileged write.
// Synthetic fields are already present: this path never calls AI or any payment API.
export async function evaluateDemo(invoice: Database['public']['Tables']['invoices']['Row']) {
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {data:claimed,error:claimError}=await supabaseAdmin.from('invoices').update({status:'processing'}).eq('id',invoice.id).eq('status','pending').eq('demo_scenario',true).select('id').maybeSingle();
  if(claimError) throw new Error(claimError.message);
  if(!claimed) return {ok:true,message:''};
  try {
    const [v,r]=await Promise.all([supabaseAdmin.from('verified_vendors').select('*'),supabaseAdmin.from('payment_rules').select('*').eq('enabled',true)]);
    if(v.error || r.error) throw new Error(v.error?.message ?? r.error?.message);
    const snapshot=invoice.security_snapshot;
    const taxId=snapshot && typeof snapshot==='object' && !Array.isArray(snapshot) && typeof snapshot['taxId']==='string'?snapshot['taxId']:null;
    const extracted={isInvoice:true,uncertain:false,vendor:invoice.vendor,invoiceNumber:invoice.invoice_number,category:invoice.category as 'software'|'travel'|'marketing'|'other'|null,amount:invoice.amount,currency:invoice.currency,date:invoice.invoice_date,dueDate:invoice.due_date,description:invoice.description,taxId};
    const merchant=matchMerchant(invoice.vendor,(v.data??[]).map(v=>({...v,disposition:v.disposition==='blocked'?'blocked' as const:'allowed' as const})));
    const supplier=v.data?.find(v=>v.name===merchant.name);
    const trust=checkSupplierReference(extracted,supplier);
    const passed=trust.passed && completeInvoiceReference(extracted);
    const rules=(r.data??[]).map(r=>({...ruleSchema.parse(r),id:r.id}));
    const base=decideInvoice(extracted,rules,merchant.disposition==='allowed',merchant);
    const decision=merchant.disposition==='blocked' || passed?base:{status:'review',es:'Proveedor sin referencia confirmada. Revisión humana necesaria; no se movió dinero.',en:'Supplier reference is not confirmed. Human review required; no money moved.'};
    const {error}=await supabaseAdmin.from('invoices').update({status:decision.status,security_status:passed?'passed':'review',matched_merchant:merchant.name,explanation_es:decision.es,explanation_en:decision.en,ai_usage:{calls:0,inputTokens:0,outputTokens:0,totalTokens:0,source:'synthetic-demo'},decision_snapshot:{simulated:true,demo:true,trustPassed:passed,supplierId:supplier?.id??null,supplierConfirmedAt:supplier?.trust_confirmed_at??null,reason:trust.reason,amount:invoice.amount,currency:invoice.currency,dueDate:invoice.due_date,channel:invoice.proposed_channel,destination:invoice.proposed_destination,rules:rules.map(r=>({...r}))}}).eq('id',invoice.id).eq('status','processing');
    if(error) throw new Error(error.message);
    return {ok:true,message:''};
  } catch(error) {
    const message=error instanceof Error?error.message:'Demo evaluation failed';
    await supabaseAdmin.from('invoices').update({status:'error',error_message:message}).eq('id',invoice.id).eq('status','processing');
    return {ok:false,message};
  }
}
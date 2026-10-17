import { describe, expect, it } from 'vitest';
import { checkSupplierReference, completeInvoiceReference, validInvoiceDate } from '@/lib/trust';
import { budgetOutcome } from '@/lib/budgets';
const supplier = { id:'test', name:'AWS', tax_id:'US-998822', invoice_prefix:'FAC-', reference_invoice_number:'FAC-000042', expected_category:'software', expected_currency:'USD', trust_confirmed_at:'2026-10-17', trust_confirmed_by:'finance' };
const invoice = { taxId:'US-998822', invoiceNumber:'FAC-000043', category:'software', currency:'USD' };
describe('Confirmed supplier and controlled budgets', () => {
  it('never marks missing amounts or due dates as eligible for manual approval',()=>{const i={...invoice,isInvoice:true,uncertain:false,vendor:'AWS',description:'Software',amount:150,date:'2026-10-17',dueDate:'2026-10-31'};expect(completeInvoiceReference(i)).toBe(true);expect(completeInvoiceReference({...i,amount:null})).toBe(false);expect(completeInvoiceReference({...i,dueDate:null})).toBe(false);});
  it('requires finance confirmation before automatic decisions', () => expect(checkSupplierReference(invoice,{...supplier,trust_confirmed_by:null}).passed).toBe(false));
  it('matches the confirmed tax ID and invoice prefix', () => { expect(checkSupplierReference(invoice,supplier).passed).toBe(true); expect(checkSupplierReference({...invoice,taxId:'OTHER'},supplier).passed).toBe(false); });
  it('escalates changed invoice format', () => expect(checkSupplierReference({...invoice,invoiceNumber:'OTHER-000043'},supplier).passed).toBe(false));
  it('does not convert currencies to match agreements', () => expect(checkSupplierReference({...invoice,currency:'COP'},supplier).passed).toBe(false));
  it('accepts actual due dates but not impossible or missing dates', () => { expect(validInvoiceDate('2026-10-31')).toBe(true); expect(validInvoiceDate('2026-02-30')).toBe(false); expect(validInvoiceDate(null)).toBe(false); });
  it('holds a payment over its hard limit', () => expect(budgetOutcome(501,0,{per_payment:500,human_above:100,period_limit:1000})).toBe('hold'));
  it('escalates above human threshold but permits finance within hard limits', () => { const b={per_payment:500,human_above:100,period_limit:1000}; expect(budgetOutcome(120,0,b)).toBe('escalate'); expect(budgetOutcome(120,0,b,true)).toBe('approve'); });
  it('reserves earlier approvals against the period limit including its boundary', () => { const b={per_payment:500,human_above:500,period_limit:1000}; expect(budgetOutcome(150,850,b)).toBe('approve'); expect(budgetOutcome(150,900,b,true)).toBe('hold'); });
});
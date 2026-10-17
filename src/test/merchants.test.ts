import { describe, it, expect } from 'vitest';
import { matchMerchant, merchantSchema, type Merchant } from '@/lib/merchants';
import { decideInvoice, type ExtractedInvoice, type PaymentRule } from '@/lib/invoice-policy';
const mc: Merchant = { name: "McDonald's", disposition: 'allowed', aliases: ['Arcos Dorados'] };
const didi: Merchant = { name: 'DiDi', disposition: 'allowed', aliases: ['DLO*'] };
const invoice: ExtractedInvoice = { isInvoice: true, vendor: 'Arcos Dorados', invoiceNumber: 'F-001', category: 'other', amount: 50, currency: 'USD', date: '2026-10-17', description: 'Meal', uncertain: false };
const rule: PaymentRule = { id: 'r', label: 'Meals', category: 'other', comparison: 'under', threshold: 100, currency: 'USD', action: 'approve', enabled: true };
describe('Merchant spending policies', () => {
  it('recognizes Arcos Dorados as explicitly configured McDonalds', () => { expect(matchMerchant('ARCOS DORADOS', [mc])).toEqual({ name: "McDonald's", disposition: 'allowed' }); });
  it('recognizes DLO descriptors only with configured prefix', () => { expect(matchMerchant('DLO*12345', [didi]).name).toBe('DiDi'); expect(matchMerchant('DLO*12345', [{...didi, aliases: ['DLO']}]).disposition).toBe('unknown'); });
  it('does not infer aliases or use substring matches', () => { expect(matchMerchant('Arcos Dorados', [{...mc, aliases: []}]).disposition).toBe('unknown'); expect(matchMerchant('Fake Arcos Dorados', [mc]).disposition).toBe('unknown'); });
  it('rejects a blocked commerce before an approval rule', () => { const m=matchMerchant(invoice.vendor, [{...mc, disposition:'blocked'}]); expect(decideInvoice(invoice,[rule],false,m).status).toBe('rejected'); });
  it('keeps conflicting merchant aliases in review', () => { const m=matchMerchant(invoice.vendor,[mc,{...mc,name:'Other'}]); expect(decideInvoice(invoice,[rule],true,m).status).toBe('review'); });
  it('does not let allowlisting bypass financial rules', () => { const m=matchMerchant(invoice.vendor,[mc]); expect(decideInvoice(invoice,[],true,m).status).toBe('review'); });
  it('requires explicit bounded prefix aliases', () => { expect(merchantSchema.safeParse({...didi,aliases:['*']}).success).toBe(false); expect(merchantSchema.safeParse(didi).success).toBe(true); });
});
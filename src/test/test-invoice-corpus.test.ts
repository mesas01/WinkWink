import { describe,it,expect } from 'vitest';
import {testInvoices} from '../lib/test-invoice-corpus';
describe('approved synthetic country corpus',()=>{
 for(const country of ['CO','BR']){
  it(`has ten invoices for ${country}`,()=>expect(testInvoices.filter(f=>f.country===country)).toHaveLength(10));
  it(`has five merchants with two invoices each for ${country}`,()=>{const rows=testInvoices.filter(f=>f.country===country);const vendors=new Set(rows.map(f=>f.vendor));expect(vendors.size).toBe(5);for(const v of vendors)expect(rows.filter(f=>f.vendor===v)).toHaveLength(2);});
 }
 it('has no real fiscal identifiers',()=>expect(testInvoices.every(f=>f.taxId.startsWith('TEST-')&&f.taxId.endsWith('-INVALID'))).toBe(true));
 it('uses COP for Colombia and BRL for Brazil',()=>{expect(testInvoices.filter(f=>f.country==='CO').every(f=>f.currency==='COP')).toBe(true);expect(testInvoices.filter(f=>f.country==='BR').every(f=>f.currency==='BRL')).toBe(true);});
});
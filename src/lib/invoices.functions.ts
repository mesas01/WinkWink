import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const runAntifraudDemo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ number: z.enum(['INV-001','INV-002','INV-003','INV-004','INV-005']) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (error || !admin) throw new Error('Forbidden');
    const { runSecurityDemo } = await import('./security-demo');
    return runSecurityDemo(data.number);
  });

export const evaluateUploadedInvoice = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: invoice, error } = await context.supabase.from('invoices').select('*').eq('id', data.id).single();
    if (error || !invoice || invoice.user_id !== context.userId) throw new Error('Invoice unavailable');
    if (!invoice.test_document) throw new Error("Real document uploads are not enabled");
    if (invoice.status !== 'pending') return { ok: true, message: '' };
    if (invoice.demo_scenario) {
      const { evaluateDemo } = await import('./transfer-demo.server');
      return evaluateDemo(invoice);
    }
    const { analyzeInvoice } = await import('./invoices.server');
    return analyzeInvoice(invoice, context.userId);
  });

export const savePaymentRule = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input) => {
    const { ruleSchema } = await import('./invoice-policy');
    return ruleSchema.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');
    const { error } = await context.supabase.from('payment_rules').insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
export const saveBudget = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(async input => { const { budgetSchema } = await import('./budgets'); return budgetSchema.parse(input); }).handler(async ({ data, context }) => {
  const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!admin) throw new Error('Forbidden');
  const { error } = await context.supabase.from('budget_limits').insert(data);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const evaluateTransferDemo = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ id:z.string().uuid() }).parse(input)).handler(async ({data,context}) => {
  const {data:invoice,error}=await context.supabase.from('invoices').select('*').eq('id',data.id).single();
  if(error || !invoice || !invoice.demo_scenario || !invoice.test_document) throw new Error('Demo invoice unavailable');
  if(invoice.user_id !== context.userId) {
    const {data:admin,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
    if(roleError || !admin) throw new Error('Forbidden');
  }
  if(invoice.status !== 'pending') return {ok:true,message:''};
  const {evaluateDemo}=await import('./transfer-demo.server');
  return evaluateDemo(invoice);
});

export const createDemoEmployeeAccess = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>z.object({id:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
  const {data:admin,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  if(roleError||!admin)throw new Error('Forbidden');
  const {data:profile,error}=await context.supabase.from('profiles').select('id,demo_employee').eq('id',data.id).single();
  if(error||!profile?.demo_employee)throw new Error('Synthetic employee unavailable');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {data:roles,error:rolesError}=await supabaseAdmin.from('user_roles').select('role').eq('user_id',data.id);
  if(rolesError||!roles?.length||roles.some(r=>r.role!=='employee'))throw new Error('Synthetic employee role required');
  const {data:account,error:accountError}=await supabaseAdmin.auth.admin.getUserById(data.id);
  if(accountError||!account.user?.email?.endsWith('@demo.winkwink.invalid'))throw new Error('Synthetic account required');
  const {data:link,error:linkError}=await supabaseAdmin.auth.admin.generateLink({type:'magiclink',email:account.user.email});
  if(linkError||!link.properties?.hashed_token)throw new Error('Could not create test access');
  return {tokenHash:link.properties.hashed_token};
});

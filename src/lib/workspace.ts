import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const workspaceOptions = queryOptions({
  queryKey: ['workspace'],
  queryFn: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error('Sign in required');
    const user = auth.user;
    const [profile, roles, consent, invoices, requests] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('consents').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('invoices').select('*, profiles(display_name)').order('created_at', { ascending: false }).limit(200),
      supabase.from('privacy_requests').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    for (const r of [profile, roles, consent, invoices, requests]) if (r.error) throw new Error(r.error.message);
    const isAdmin = Boolean(roles.data?.some((r) => r.role === 'admin'));
    const rules = isAdmin && consent.data ? await supabase.from('payment_rules').select('*').order('created_at') : { data: [], error: null };
    const vendors = isAdmin && consent.data ? await supabase.from('verified_vendors').select('*').order('name') : { data: [], error: null };
    const employees = isAdmin && consent.data ? await supabase.from('profiles').select('id,display_name,demo_employee').order('display_name') : { data: profile.data ? [profile.data] : [], error: null };
    const budgets = consent.data ? await supabase.from('budget_limits').select('*').order('created_at') : { data: [], error: null };
    if (rules.error || vendors.error || employees.error || budgets.error) throw new Error(rules.error?.message ?? vendors.error?.message ?? employees.error?.message ?? budgets.error?.message);
    return { user, profile: profile.data, isAdmin, consent: consent.data, invoices: invoices.data ?? [], rules: rules.data ?? [], vendors: vendors.data ?? [], requests: requests.data ?? [], employees: employees.data ?? [], budgets: budgets.data ?? [] };
  },
});
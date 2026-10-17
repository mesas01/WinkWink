import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Tags, ListChecks, History, Store, Search, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Merchants } from '@/components/merchants';
import { SpendMetrics } from '@/components/spend-metrics';
import { BudgetPanel } from '@/components/budget-panel';
import { AgentExplanation } from '@/components/agent-explanation';
import type { Database } from '@/integrations/supabase/types';

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Workspace = { user: { id: string }; isAdmin: boolean; rules: Row<'payment_rules'>[]; invoices: Row<'invoices'>[]; vendors: Row<'verified_vendors'>[] };
const categories = [
  { id: 'software', es: 'Software / SaaS', en: 'Software / SaaS' },
  { id: 'travel', es: 'Viáticos', en: 'Travel' },
  { id: 'marketing', es: 'Marketing', en: 'Marketing' },
  { id: 'other', es: 'Otros gastos', en: 'Other expenses' },
  { id: 'unknown', es: 'Proveedor desconocido', en: 'Unknown vendor' },
] as const;

export function AdminPanel({ workspace: w, es, refresh, onAddRule, onInvoice }: {
  workspace: Workspace; es: boolean; refresh: () => Promise<unknown>;
  onAddRule: () => void; onInvoice: (id: string) => void;
}) {
  const [tab, setTab] = useState('merchants');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [changing, setChanging] = useState<string | null>(null);
  const history = useQuery({
    queryKey: ['admin-evaluations', w.user.id],
    enabled: w.isAdmin && tab === 'evaluations',
    queryFn: async () => {
      const { data, error } = await supabase.from('invoice_events')
        .select('id,invoice_id,created_at,message_es,message_en,invoices(vendor,file_name,invoice_number)')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  if (!w.isAdmin) return null;
  const rules = w.rules.filter(r => category === 'all' || r.category === category);
  const name = (id: string) => { const c = categories.find(c => c.id === id); return c ? (es ? c.es : c.en) : id; };
  const tabs = [
    { id: 'merchants', label: es ? 'Reglas Activas' : 'Active Rules', icon: Store },
    { id: 'categories', label: es ? 'Categorías' : 'Categories', icon: Tags },
    { id: 'rules', label: es ? 'Reglas' : 'Rules', icon: ListChecks },
    { id: 'evaluations', label: es ? 'Evaluaciones' : 'Evaluations', icon: History },
    { id: 'metrics', label: es ? 'Métricas' : 'Metrics', icon: BarChart3 },
    { id: 'budgets', label: es ? 'Presupuestos' : 'Budgets', icon: BarChart3 },
    { id: 'agent', label: es ? 'Cómo decide' : 'How it decides', icon: ListChecks },
  ];
  async function changeRule(id: string, enabled?: boolean) {
    setChanging(id);
    try {
      const result = enabled === undefined
        ? await supabase.from('payment_rules').delete().eq('id', id)
        : await supabase.from('payment_rules').update({ enabled }).eq('id', id);
      if (result.error) throw result.error;
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Error'); }
    finally { setChanging(null); }
  }
  return <section className="mt-7 min-w-0">
    <div className="grid gap-4 border-b pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {[[es ? 'Reglas activas' : 'Active rules', w.rules.filter(r => r.enabled).length], [es ? 'Facturas' : 'Invoices', w.invoices.length], [es ? 'En revisión' : 'In review', w.invoices.filter(i => i.status === 'review').length]].map(([label, value]) => <div key={label}><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}
      </div>
      <Button onClick={onAddRule} className="w-fit"><Plus />{es ? 'Definir regla' : 'Define rule'}</Button>
    </div>
    <nav aria-label={es ? 'Panel administrativo' : 'Administration panel'} className="mt-5 flex flex-wrap gap-2">
      {tabs.map(t => <Button key={t.id} variant={tab === t.id ? 'secondary' : 'ghost'} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}><t.icon />{t.label}</Button>)}
    </nav>
    {tab === 'metrics' && <SpendMetrics es={es} userId={w.user.id} />}
    {tab === 'budgets' && <BudgetPanel es={es} />}
    {tab === 'agent' && <AgentExplanation es={es} />}
    {tab === 'categories' && <section className="mt-7"><h2 className="text-xl font-semibold">{es ? 'Categorías y condiciones' : 'Categories and conditions'}</h2>
      <ul className="mt-5 divide-y border-y">{categories.map(c => <li key={c.id}><Button variant="ghost" className="h-auto w-full justify-between gap-4 rounded-none py-5 text-left whitespace-normal" onClick={() => { setCategory(c.id); setTab('rules'); }}><span className="font-medium">{name(c.id)}</span><span className="shrink-0 text-sm text-muted-foreground">{w.rules.filter(r => r.category === c.id).length} {es ? 'reglas' : 'rules'}</span></Button></li>)}</ul>
    </section>}
    {tab === 'rules' && <section className="mt-7"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">{es ? 'Reglas de evaluación' : 'Evaluation rules'}</h2><label className="text-sm">{es ? 'Categoría' : 'Category'}<select value={category} onChange={e => setCategory(e.target.value)} className="ml-2 max-w-full rounded-md border bg-background p-2"><option value="all">{es ? 'Todas' : 'All'}</option>{categories.map(c => <option key={c.id} value={c.id}>{name(c.id)}</option>)}</select></label></div>
      <ul className="mt-5 divide-y border-y">{rules.map(r => <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-5"><div className="min-w-0 break-words"><p className="font-medium">{r.label}</p><p className="mt-1 text-sm text-muted-foreground">{name(r.category)} · {r.comparison === 'always' ? (es ? 'Siempre' : 'Always') : `${r.comparison === 'under' ? '<' : '>'} ${r.threshold.toLocaleString(es ? 'es-CO' : 'en')} ${r.currency}`} · {r.action === 'approve' ? (es ? 'Aprobar' : 'Approve') : (es ? 'Revisión humana' : 'Human review')}</p></div><div className="flex items-center gap-2"><Switch disabled={changing !== null} aria-label={`${es ? 'Activar regla' : 'Enable rule'}: ${r.label}`} checked={r.enabled} onCheckedChange={enabled => changeRule(r.id, enabled)} /><Button disabled={changing !== null} variant="ghost" size="icon" aria-label={`${es ? 'Eliminar regla' : 'Delete rule'}: ${r.label}`} onClick={() => changeRule(r.id)}><Trash2 /></Button></div></li>)}</ul>
      {rules.length === 0 && <p className="py-8 text-sm text-muted-foreground">{es ? 'No hay reglas en esta categoría.' : 'No rules in this category.'}</p>}
    </section>}
    {tab === 'evaluations' && <section className="mt-7"><h2 className="text-xl font-semibold">{es ? 'Historial de evaluaciones' : 'Evaluation history'}</h2><label className="relative mt-5 block max-w-lg"><span className="sr-only">{es ? 'Buscar evaluaciones' : 'Search evaluations'}</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={es ? 'Proveedor, factura o decisión' : 'Supplier, invoice or decision'} className="pl-10" /></label>
      {history.isPending && <p role="status" className="mt-6 flex gap-2 text-sm"><Loader2 className="size-4 animate-spin" />{es ? 'Cargando evaluaciones…' : 'Loading evaluations…'}</p>}
      {history.isError && <div role="alert" className="mt-6"><p className="text-sm text-destructive">{es ? 'No se pudo cargar el historial.' : 'Could not load history.'}</p><Button variant="outline" className="mt-3" onClick={() => history.refetch()}>{es ? 'Reintentar' : 'Retry'}</Button></div>}
      {history.data && <ol className="mt-5 divide-y border-y">{history.data.filter(e => `${e.invoices?.vendor} ${e.invoices?.file_name} ${e.invoices?.invoice_number} ${es ? e.message_es : e.message_en}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(e => <li key={e.id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-2"><Button variant="link" className="h-auto max-w-full justify-start p-0 text-left whitespace-normal break-words" onClick={() => onInvoice(e.invoice_id)}>{e.invoices?.vendor || e.invoices?.file_name || (es ? 'Factura' : 'Invoice')}{e.invoices?.invoice_number ? ` · ${e.invoices.invoice_number}` : ''}</Button><time className="text-xs text-muted-foreground" dateTime={e.created_at}>{new Date(e.created_at).toLocaleString(es ? 'es-CO' : 'en')}</time></div><p className="mt-2 break-words text-sm leading-6">{es ? e.message_es : e.message_en}</p></li>)}</ol>}
      {history.data?.length === 0 && <p className="py-8 text-sm text-muted-foreground">{es ? 'Todavía no hay evaluaciones registradas.' : 'No evaluations recorded yet.'}</p>}
    </section>}
    {tab === 'merchants' && <Merchants es={es} merchants={w.vendors.map(v => ({ ...v, disposition: v.disposition === 'blocked' ? 'blocked' as const : 'allowed' as const }))} refresh={refresh} />}
  </section>;
}
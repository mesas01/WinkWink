export type MetricInvoice = {
  id: string; user_id: string; amount: number | null; currency: string | null;
  category: string | null; status: string; invoice_date: string | null;
  profiles?: { display_name: string } | null;
};
export type Period = 'day' | 'half-month' | 'month';
export function validDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}
export function periodKey(date: string, period: Period) {
  return period === 'day' ? date : period === 'month' ? date.slice(0, 7) : `${date.slice(0, 7)}-${Number(date.slice(8)) <= 15 ? '01' : '16'}`;
}
export function spendMetrics(invoices: MetricInvoice[], options: { currency: string; employee: string; start: string; end: string; period: Period }) {
  const scoped = invoices.filter(i => i.currency === options.currency && (options.employee === 'all' || i.user_id === options.employee));
  const rows = scoped.filter(i => {
    const date = validDate(i.invoice_date);
    return date && (!options.start || date >= options.start) && (!options.end || date <= options.end);
  });
  const usable = rows.filter(i => i.amount !== null && Number.isFinite(i.amount) && i.amount >= 0);
  const approved = usable.filter(i => i.status === 'approved');
  const sum = (list: MetricInvoice[]) => list.reduce((total, i) => total + (i.amount ?? 0), 0);
  const groups = (key: (i: MetricInvoice) => string) => {
    const map = new Map<string, { key: string; total: number; count: number }>();
    for (const i of approved) {
      const k = key(i); const row = map.get(k) ?? { key: k, total: 0, count: 0 };
      row.total += i.amount ?? 0; row.count++; map.set(k, row);
    }
    return [...map.values()];
  };
  return {
    total: sum(approved), submitted: sum(usable), review: sum(usable.filter(i => i.status === 'review')),
    rejected: sum(usable.filter(i => i.status === 'rejected')), count: approved.length,
    average: approved.length ? sum(approved) / approved.length : 0,
    missingDates: scoped.filter(i => !validDate(i.invoice_date)).length,
    missingAmounts: rows.length - usable.length,
    periods: groups(i => periodKey(i.invoice_date ?? '', options.period)).sort((a, b) => a.key.localeCompare(b.key)),
    categories: groups(i => i.category ?? 'unclassified').sort((a, b) => b.total - a.total),
    employees: groups(i => i.user_id).sort((a, b) => b.total - a.total),
  };
}
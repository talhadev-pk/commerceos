import { useMemo, useState } from 'react'
import { FileBarChart2, Package, Boxes, Users, ShoppingCart, Wallet, Download, Play } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CATEGORIES } from '../../data/seed'
import { categoryPerformance, computeMetrics, customerStats, downloadCSV, filterByPeriod, fmtDate, fmtMoney, productPerformance, stockState } from '../../lib/utils'
import { Card, Empty, PageHead, SectionTitle, btnPrimary, cx, inputCls, labelCls, rowCls, tdCls, thCls } from '../../components/ui'

type ReportKey = 'sales' | 'products' | 'inventory' | 'customers' | 'orders' | 'finance'
const REPORTS: { key: ReportKey; name: string; desc: string; icon: typeof FileBarChart2 }[] = [
  { key: 'sales', name: 'Sales Report', desc: 'Daily revenue, orders and average order value', icon: FileBarChart2 },
  { key: 'products', name: 'Product Report', desc: 'Units, revenue, profit and margin per product', icon: Package },
  { key: 'inventory', name: 'Inventory Report', desc: 'Stock levels, health and valuation by product', icon: Boxes },
  { key: 'customers', name: 'Customer Report', desc: 'Spend, order count and recency per customer', icon: Users },
  { key: 'orders', name: 'Order Report', desc: 'Every order with totals, status and channel', icon: ShoppingCart },
  { key: 'finance', name: 'Financial Report', desc: 'P&L lines: sales, discounts, COGS, profit, refunds', icon: Wallet },
]

interface Table { headers: string[]; rows: (string | number)[][] }

export default function Reports() {
  const { orders, products, customers, toast } = useStore()
  const [report, setReport] = useState<ReportKey>('sales')
  const [days, setDays] = useState(30)
  const [cat, setCat] = useState('all')
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  const data: Table = useMemo(() => {
    const scoped = filterByPeriod(orders, days)
    const catScoped = cat === 'all' ? scoped : scoped.filter(o => o.items.some(it => products.find(p => p.id === it.productId)?.category === cat))
    switch (report) {
      case 'sales': {
        const byDay = new Map<string, { rev: number; n: number }>()
        for (const o of catScoped) { if (o.status === 'cancelled' || o.status === 'returned') continue; const k = o.date.slice(0, 10); const cur = byDay.get(k) ?? { rev: 0, n: 0 }; cur.rev += o.total; cur.n += 1; byDay.set(k, cur) }
        return { headers: ['Date', 'Orders', 'Revenue', 'Avg. Order Value'], rows: [...byDay.entries()].sort().map(([d, v]) => [fmtDate(d), v.n, v.rev.toFixed(2), (v.rev / v.n).toFixed(2)]) }
      }
      case 'products':
        return { headers: ['Product', 'SKU', 'Category', 'Units Sold', 'Revenue', 'Est. Profit', 'Margin %'], rows: productPerformance(catScoped, products).map(r => [r.product.name, r.product.sku, r.product.category, r.units, r.revenue.toFixed(2), r.profit.toFixed(2), r.revenue ? ((r.profit / r.revenue) * 100).toFixed(1) : '0']) }
      case 'inventory': {
        const list = cat === 'all' ? products : products.filter(p => p.category === cat)
        return { headers: ['Product', 'SKU', 'Category', 'Stock', 'Available', 'Health', 'Unit Cost', 'Stock Value'], rows: list.map(p => [p.name, p.sku, p.category, p.stock, Math.max(0, p.stock - p.reserved), stockState(p), p.cost.toFixed(2), (p.stock * p.cost).toFixed(2)]) }
      }
      case 'customers':
        return { headers: ['Customer', 'Email', 'Segment', 'Orders', 'Total Spend', 'Avg. Order', 'Last Purchase'], rows: customerStats(catScoped, customers).filter(c => c.orders > 0).map(c => [c.customer.name, c.customer.email, c.customer.segment, c.orders, c.spend.toFixed(2), c.aov.toFixed(2), c.lastPurchase ? fmtDate(c.lastPurchase) : '—']) }
      case 'orders':
        return { headers: ['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Payment', 'Channel'], rows: catScoped.map(o => [o.id, customers.find(c => c.id === o.customerId)?.name ?? 'Deleted customer', fmtDate(o.date), o.items.reduce((s, i) => s + i.qty, 0), o.total.toFixed(2), o.status, o.payment, o.channel]) }
      case 'finance': {
        const m = computeMetrics(catScoped)
        return { headers: ['Line Item', 'Amount (USD)'] as string[], rows: [['Gross sales', m.grossSales.toFixed(2)], ['Discounts', (-m.discounts).toFixed(2)], ['Net sales', m.netSales.toFixed(2)], ['Shipping revenue', m.shippingRevenue.toFixed(2)], ['Total revenue', m.revenue.toFixed(2)], ['Estimated product costs', (-m.productCosts).toFixed(2)], ['Estimated gross profit', m.grossProfit.toFixed(2)], ['Refunds', (-m.refunds).toFixed(2)]] }
      }
    }
  }, [report, days, cat, orders, products, customers])

  const catRows = useMemo(() => categoryPerformance(filterByPeriod(orders, days), products), [orders, days, products])

  const run = () => { setGeneratedAt(new Date().toLocaleTimeString()); toast(`${REPORTS.find(r => r.key === report)?.name} generated — ${data.rows.length} rows from live demo data.`) }
  const exportCSV = () => { downloadCSV(`commerceos-${report}-report-${days}d.csv`, data.headers, data.rows); toast('Report exported as CSV.') }

  return (
    <div>
      <PageHead title="Reports" sub="Configure a report, preview real results from your local data, then export to CSV. Nothing leaves your browser." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 px-1 text-sm font-semibold text-slate-900 dark:text-white">Report type</p>
            <div className="space-y-1.5" role="radiogroup" aria-label="Report type">
              {REPORTS.map(r => (
                <button key={r.key} role="radio" aria-checked={report === r.key} onClick={() => setReport(r.key)}
                  className={cx('flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition', report === r.key ? 'border-brand-500/50 bg-brand-500/[0.07]' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.04]')}>
                  <r.icon size={19} className={report === r.key ? 'text-brand-500' : 'text-slate-400'} />
                  <span><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{r.name}</span><span className="mt-0.5 block text-xs text-slate-400">{r.desc}</span></span>
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-4 p-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Configuration</p>
            <div>
              <label htmlFor="r-days" className={labelCls}>Date range</label>
              <select id="r-days" value={days} onChange={e => setDays(Number(e.target.value))} className={inputCls}>
                <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={3650}>All time</option>
              </select>
            </div>
            <div>
              <label htmlFor="r-cat" className={labelCls}>Category filter</label>
              <select id="r-cat" value={cat} onChange={e => setCat(e.target.value)} className={inputCls}>
                <option value="all">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button className={cx(btnPrimary, 'w-full')} onClick={run}><Play size={15} /> Generate report</button>
            {generatedAt && <p className="text-center text-xs text-slate-400">Last generated at {generatedAt} · {data.rows.length} rows</p>}
          </Card>
          <Card className="p-5">
            <SectionTitle title="Category snapshot" sub={`Revenue — last ${days === 3650 ? '∞' : days} days`} />
            <ul className="space-y-2.5">
              {catRows.map(c => <li key={c.category} className="flex items-center justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">{c.category}</span><strong className="text-slate-900 dark:text-white">{fmtMoney(c.revenue)}</strong></li>)}
              {catRows.length === 0 && <li className="text-sm text-slate-400">No category revenue in range.</li>}
            </ul>
          </Card>
        </div>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
            <SectionTitle title={`${REPORTS.find(r => r.key === report)?.name} — Preview`} sub={`${data.rows.length} rows · generated from actual local application data`} />
            <button className={btnPrimary} onClick={exportCSV} disabled={data.rows.length === 0}><Download size={15} /> Export CSV</button>
          </div>
          {data.rows.length === 0 ? <Empty title="No data for this configuration" body="Widen the date range or clear the category filter to see results." /> : (
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full min-w-[620px]">
                <thead className="sticky top-0 bg-white dark:bg-ink-900"><tr>{data.headers.map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.rows.slice(0, 60).map((row, i) => (
                    <tr key={i} className={rowCls}>{row.map((cell, j) => <td key={j} className={cx(tdCls, j === 0 && 'font-medium text-slate-900 dark:text-white')}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {data.rows.length > 60 && <p className="px-5 py-3 text-xs text-slate-400">Preview shows the first 60 rows — the CSV export includes all {data.rows.length}.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

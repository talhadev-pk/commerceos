import { useMemo, useState } from 'react'
import { Download, DollarSign, TrendingUp, ShoppingCart, Receipt, Percent } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CATEGORIES } from '../../data/seed'
import { categoryPerformance, computeMetrics, customerStats, dailySeries, downloadCSV, filterByPeriod, fmtMoney, fmtNum, pctChange, previousPeriod, productPerformance } from '../../lib/utils'
import { Card, DemoBanner, PageHead, ProductVisual, SectionTitle, StatCard, btnGhost, cx, inputCls, rowCls, tdCls, thCls } from '../../components/ui'
import { CategoryDonut, HBar, RevenueArea, TrendLines } from '../../components/Charts'
import type { Period } from '../../types'

export default function Analytics() {
  const { orders, products, customers, toast } = useStore()
  const [period, setPeriod] = useState<Period>(90)
  const [cat, setCat] = useState('all')

  const scoped = useMemo(() => {
    let rows = filterByPeriod(orders, period)
    if (cat !== 'all') rows = rows.filter(o => o.items.some(it => products.find(p => p.id === it.productId)?.category === cat))
    return rows
  }, [orders, period, cat, products])
  const prev = useMemo(() => previousPeriod(orders, period), [orders, period])
  const m = useMemo(() => computeMetrics(scoped), [scoped])
  const pm = useMemo(() => computeMetrics(prev), [prev])
  const series = useMemo(() => dailySeries(scoped, period), [scoped, period])
  const cats = useMemo(() => categoryPerformance(filterByPeriod(orders, period), products), [orders, period, products])
  const perf = useMemo(() => productPerformance(scoped, products), [scoped, products])
  const topCustomers = useMemo(() => customerStats(scoped, customers).filter(c => c.orders > 0).slice(0, 6), [scoped, customers])
  const channelData = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>()
    for (const o of scoped) { if (o.status === 'cancelled' || o.status === 'returned') continue; const cur = map.get(o.channel) ?? { name: o.channel, value: 0 }; cur.value += o.total; map.set(o.channel, cur) }
    return [...map.values()].sort((a, b) => b.value - a.value)
  }, [scoped])
  const aovSeries = series.map(d => ({ ...d, aov: d.orders ? Math.round((d.revenue / d.orders) * 100) / 100 : 0 }))

  const exportPerf = () => {
    downloadCSV(`commerceos-product-performance-${period}d.csv`, ['Product', 'SKU', 'Category', 'Units Sold', 'Revenue', 'Est. Profit', 'Margin %'],
      perf.map(r => [r.product.name, r.product.sku, r.product.category, r.units, r.revenue.toFixed(2), r.profit.toFixed(2), r.revenue ? ((r.profit / r.revenue) * 100).toFixed(1) : '0']))
    toast('Product performance report exported.')
  }

  return (
    <div>
      <PageHead title="Analytics" sub="Business intelligence computed live from your order, product and customer data — change the period or category and every chart recalculates."
        action={<button className={btnGhost} onClick={exportPerf}><Download size={15} /> Export performance CSV</button>} />
      <DemoBanner />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="flex rounded-xl border border-slate-200 p-1 dark:border-white/10" role="tablist" aria-label="Analytics period">
          {([7, 30, 90] as Period[]).map(p => (
            <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)} className={cx('rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition', period === p ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>Last {p} days</button>
          ))}
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)} aria-label="Category filter" className={cx(inputCls, 'w-auto')}>
          <option value="all">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <p className="ml-auto text-[13px] text-slate-400">Comparing against the previous {period} days</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Revenue" value={fmtMoney(m.revenue)} delta={pctChange(m.revenue, pm.revenue)} icon={DollarSign} />
        <StatCard label="Sales Growth" value={`${pctChange(m.revenue, pm.revenue) >= 0 ? '+' : ''}${pctChange(m.revenue, pm.revenue).toFixed(1)}%`} icon={TrendingUp} hint="Revenue vs previous period" />
        <StatCard label="Order Volume" value={fmtNum(m.orders)} delta={pctChange(m.orders, pm.orders)} icon={ShoppingCart} />
        <StatCard label="Avg. Order Value" value={fmtMoney(m.aov)} delta={pctChange(m.aov, pm.aov)} icon={Receipt} />
        <StatCard label="Gross Margin" value={`${m.margin.toFixed(1)}%`} delta={m.margin - pm.margin} icon={Percent} hint="Percentage points vs prev." />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <SectionTitle title="Revenue & Profit Trend" sub="Estimated profit = (price − cost) × quantity, per order line" />
          <RevenueArea data={series} showProfit height={320} />
        </Card>
        <Card className="p-5">
          <SectionTitle title="Category Performance" sub="Revenue share, all categories" />
          <CategoryDonut data={cats} height={312} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Average Order Value Trend" sub="Revenue per order over time" />
          <TrendLines data={aovSeries} keys={[{ key: 'aov', name: 'Avg. order value', color: '#14b8a6' }]} height={250} />
        </Card>
        <Card className="p-5">
          <SectionTitle title="Sales Distribution by Channel" sub="Where revenue originates" />
          <HBar data={channelData} height={250} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 pb-2"><SectionTitle title="Product Performance" sub="Ranked by revenue in the selected scope" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr><th className={thCls}>Product</th><th className={thCls}>Units</th><th className={thCls}>Revenue</th><th className={thCls}>Est. profit</th><th className={thCls}>Margin</th><th className={thCls}>Stock left</th></tr></thead>
              <tbody>
                {perf.slice(0, 10).map(r => (
                  <tr key={r.product.id} className={rowCls}>
                    <td className={tdCls}><span className="flex items-center gap-3"><ProductVisual product={r.product} size="sm" /><span className="font-medium text-slate-900 dark:text-white">{r.product.name}</span></span></td>
                    <td className={tdCls}>{r.units}</td>
                    <td className={cx(tdCls, 'font-semibold')}>{fmtMoney(r.revenue)}</td>
                    <td className={cx(tdCls, 'text-emerald-500 font-medium')}>{fmtMoney(r.profit)}</td>
                    <td className={tdCls}>{r.revenue ? ((r.profit / r.revenue) * 100).toFixed(1) : 0}%</td>
                    <td className={tdCls}>{r.product.stock}</td>
                  </tr>
                ))}
                {perf.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No sales in this scope yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Top Customers" sub="Customer acquisition & value overview" />
          <ul className="space-y-3.5">
            {topCustomers.map(({ customer, orders: n, spend }, i) => (
              <li key={customer.id} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-bold text-slate-300 dark:text-slate-600">{i + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{customer.name}</p><p className="text-xs text-slate-400">{n} orders · {customer.segment}</p></div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(spend)}</span>
              </li>
            ))}
            {topCustomers.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No customer activity in this scope.</li>}
          </ul>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-100">Inventory performance:</strong> {fmtNum(products.filter(p => p.stock > p.reorderLevel).length)} of {products.length} products are above reorder level.
            Slow-moving stock (no sales in scope): {fmtNum(products.length - perf.length)} products.
          </div>
        </Card>
      </div>
    </div>
  )
}

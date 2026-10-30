import { useMemo, useState } from 'react'
import { Download, Wallet, PiggyBank, ReceiptText, Truck } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { computeMetrics, dailySeries, downloadCSV, filterByPeriod, fmtMoney, pctChange, previousPeriod } from '../../lib/utils'
import { Card, DemoBanner, PageHead, SectionTitle, StatCard, btnGhost, cx } from '../../components/ui'
import { TrendLines } from '../../components/Charts'
import type { Period } from '../../types'

export default function Finance() {
  const { orders, products, toast } = useStore()
  const [period, setPeriod] = useState<Period>(90)
  const cur = useMemo(() => filterByPeriod(orders, period), [orders, period])
  const prev = useMemo(() => previousPeriod(orders, period), [orders, period])
  const m = useMemo(() => computeMetrics(cur), [cur])
  const pm = useMemo(() => computeMetrics(prev), [prev])
  const series = useMemo(() => dailySeries(orders, period), [orders, period])
  const inventoryAtCost = products.reduce((s, p) => s + p.stock * p.cost, 0)

  const rows: [string, number, string][] = [
    ['Gross sales', m.grossSales, 'Sum of order subtotals (before discounts), excluding cancelled & returned orders'],
    ['Discounts', -m.discounts, 'Promotional discounts applied at checkout'],
    ['Net sales', m.netSales, 'Gross sales − discounts'],
    ['Shipping revenue', m.shippingRevenue, 'Delivery charges collected from customers'],
    ['Total revenue', m.revenue, 'Net sales + shipping (equals the sum of order totals)'],
    ['Estimated product costs (COGS)', -m.productCosts, 'Σ (unit cost × quantity) across all order lines'],
    ['Estimated gross profit', m.grossProfit, 'Net sales − estimated product costs'],
    ['Refunds (returned orders)', -m.refunds, 'Full totals of orders marked “returned”'],
  ]

  const exportCSV = () => {
    downloadCSV(`commerceos-finance-${period}d.csv`, ['Line Item', 'Amount (USD)', 'How it is calculated'], rows.map(([k, v, d]) => [k, v.toFixed(2), d]))
    toast('Financial summary exported.')
  }

  return (
    <div>
      <PageHead title="Financial Overview" sub="Demonstration figures derived from simulated orders. This is not audited accounting data and is not connected to any bank or payment provider."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04]" role="tablist" aria-label="Finance period">
              {([7, 30, 90] as Period[]).map(p => <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)} className={cx('rounded-lg px-3 py-1.5 text-[13px] font-medium transition', period === p ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>{p}d</button>)}
            </div>
            <button className={btnGhost} onClick={exportCSV}><Download size={15} /> Export</button>
          </div>
        } />
      <DemoBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net Sales" value={fmtMoney(m.netSales)} delta={pctChange(m.netSales, pm.netSales)} icon={ReceiptText} />
        <StatCard label="Est. Gross Profit" value={fmtMoney(m.grossProfit)} delta={pctChange(m.grossProfit, pm.grossProfit)} icon={PiggyBank} />
        <StatCard label="Gross Margin" value={`${m.margin.toFixed(1)}%`} icon={Wallet} hint="Gross profit ÷ net sales" />
        <StatCard label="Shipping Revenue" value={fmtMoney(m.shippingRevenue)} delta={pctChange(m.shippingRevenue, pm.shippingRevenue)} icon={Truck} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-6 xl:col-span-2">
          <SectionTitle title={`Profit & Loss — last ${period} days`} sub="Every line explains exactly how it is calculated" />
          <dl>
            {rows.map(([label, value, desc], i) => {
              const isTotal = label === 'Net sales' || label === 'Total revenue' || label === 'Estimated gross profit'
              return (
                <div key={label} className={cx('flex items-start justify-between gap-4 py-3', i > 0 && 'border-t border-slate-100 dark:border-white/[0.05]', isTotal && 'rounded-lg bg-slate-50 px-3 dark:bg-white/[0.04]')}>
                  <div><dt className={cx('text-sm', isTotal ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200')}>{label}</dt><dd className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</dd></div>
                  <dd className={cx('whitespace-nowrap text-sm', isTotal ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold', value < 0 && 'text-rose-500')}>{value < 0 ? `−${fmtMoney(Math.abs(value))}` : fmtMoney(value)}</dd>
                </div>
              )
            })}
          </dl>
        </Card>
        <div className="space-y-4 xl:col-span-3">
          <Card className="p-5">
            <SectionTitle title="Revenue vs Estimated Profit" sub="Trend across the selected period" />
            <TrendLines data={series} keys={[{ key: 'revenue', name: 'Revenue', color: '#6366f1' }, { key: 'profit', name: 'Est. profit', color: '#14b8a6' }]} height={280} />
          </Card>
          <Card className="p-5">
            <SectionTitle title="Balance Snapshot (illustrative)" sub="Derived live from current inventory and order states" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[['Inventory at cost', fmtMoney(inventoryAtCost), 'Stock currently on hand valued at unit cost'],
                ['Pending order value', fmtMoney(orders.filter(o => o.status === 'pending' || o.status === 'confirmed').reduce((s, o) => s + o.total, 0)), 'Orders not yet fulfilled'],
                ['Refunds liability', fmtMoney(m.refunds), 'Returned orders in the selected period']].map(([k, v, d]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]"><p className="text-lg font-bold text-slate-900 dark:text-white">{v}</p><p className="mt-1 text-[13px] font-medium text-slate-600 dark:text-slate-300">{k}</p><p className="mt-0.5 text-xs text-slate-400">{d}</p></div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">CommerceOS is a frontend demonstration. Figures are estimates for portfolio purposes only and must not be used for tax, accounting, or investment decisions.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

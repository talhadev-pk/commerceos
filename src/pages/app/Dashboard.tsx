import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DollarSign, ShoppingCart, Receipt, Package, Boxes, Users, AlertTriangle, ArrowRight, Activity as ActivityIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { computeMetrics, dailySeries, filterByPeriod, fmtDate, fmtMoney, fmtNum, pctChange, previousPeriod, productPerformance, stockState, timeAgo } from '../../lib/utils'
import { Avatar, Badge, Card, DemoBanner, PageHead, ProductVisual, SectionTitle, StatCard, orderTone, cx } from '../../components/ui'
import { CategoryDonut, OrdersBar, RevenueArea } from '../../components/Charts'
import { categoryPerformance } from '../../lib/utils'
import type { Period } from '../../types'

const fade = { hidden: { opacity: 0, y: 14 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) }

export default function Dashboard() {
  const { orders, products, customers, activities, settings } = useStore()
  const [period, setPeriod] = useState<Period>(30)

  const cur = useMemo(() => filterByPeriod(orders, period), [orders, period])
  const prev = useMemo(() => previousPeriod(orders, period), [orders, period])
  const m = useMemo(() => computeMetrics(cur), [cur])
  const pm = useMemo(() => computeMetrics(prev), [prev])
  const series = useMemo(() => dailySeries(orders, period), [orders, period])
  const top = useMemo(() => productPerformance(cur, products).slice(0, 5), [cur, products])
  const cats = useMemo(() => categoryPerformance(cur, products), [cur, products])
  const lowStock = useMemo(() => products.filter(p => stockState(p) !== 'healthy').sort((a, b) => a.stock - b.stock), [products])
  const inventoryValue = useMemo(() => products.reduce((s, p) => s + p.stock * p.cost, 0), [products])
  const recentOrders = orders.slice(0, 6)

  const stats = [
    { label: 'Total Revenue', value: fmtMoney(m.revenue), delta: pctChange(m.revenue, pm.revenue), icon: DollarSign },
    { label: 'Total Orders', value: fmtNum(m.orders), delta: pctChange(m.orders, pm.orders), icon: ShoppingCart },
    { label: 'Average Order Value', value: fmtMoney(m.aov), delta: pctChange(m.aov, pm.aov), icon: Receipt },
    { label: 'Units Sold', value: fmtNum(m.units), delta: pctChange(m.units, pm.units), icon: Package },
    { label: 'Inventory Value (at cost)', value: fmtMoney(inventoryValue), icon: Boxes, hint: `${fmtNum(products.reduce((s, p) => s + p.stock, 0))} units in stock` },
    { label: 'Active Products', value: fmtNum(products.filter(p => p.status === 'active').length), icon: Package, hint: `${products.length} total in catalog` },
    { label: 'Customers', value: fmtNum(customers.length), icon: Users, hint: `${customers.filter(c => c.status === 'vip').length} VIP customers` },
    { label: 'Low-Stock Alerts', value: fmtNum(lowStock.length), icon: AlertTriangle, hint: `${lowStock.filter(p => p.stock === 0).length} out of stock` },
  ]

  return (
    <div>
      <PageHead title={`Welcome back — ${settings.storeName}`} sub="Executive overview of sales, inventory and customer performance."
        action={
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04]" role="tablist" aria-label="Reporting period">
            {([7, 30, 90] as Period[]).map(p => (
              <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}
                className={cx('relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition', period === p ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>
                {period === p && <motion.span layoutId="period-pill" className="absolute inset-0 rounded-lg bg-brand-600" />}
                <span className="relative">{p} days</span>
              </button>
            ))}
          </div>
        } />
      <DemoBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fade} initial="hidden" animate="show">
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div custom={4} variants={fade} initial="hidden" animate="show" className="xl:col-span-2">
          <Card className="p-5">
            <SectionTitle title="Revenue Performance" sub={`Daily revenue and estimated gross profit — last ${period} days`} />
            <RevenueArea data={series} showProfit />
          </Card>
        </motion.div>
        <motion.div custom={5} variants={fade} initial="hidden" animate="show">
          <Card className="p-5">
            <SectionTitle title="Sales by Category" sub="Revenue distribution" />
            <CategoryDonut data={cats} height={292} />
          </Card>
        </motion.div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <SectionTitle title="Order Volume" sub="Orders per day" />
          <OrdersBar data={series} height={230} />
        </Card>

        <Card className="p-5">
          <SectionTitle title="Top-Selling Products" sub="By revenue in selected period" action={<Link to="/app/products" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-500 hover:underline">All products <ArrowRight size={13} /></Link>} />
          <ul className="space-y-3">
            {top.map(({ product, units, revenue }) => (
              <li key={product.id} className="flex items-center gap-3">
                <ProductVisual product={product} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                  <p className="text-xs text-slate-400">{units} units · {product.category}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(revenue)}</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No sales in this period yet.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Inventory Alerts" sub="Products at or below reorder level" action={<Link to="/app/inventory" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-500 hover:underline">Manage <ArrowRight size={13} /></Link>} />
          <ul className="space-y-3">
            {lowStock.slice(0, 5).map(p => (
              <li key={p.id} className="flex items-center gap-3">
                <ProductVisual product={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-400">Reorder level {p.reorderLevel}</p>
                </div>
                <Badge tone={p.stock === 0 ? 'red' : 'amber'}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</Badge>
              </li>
            ))}
            {lowStock.length === 0 && <li className="py-6 text-center text-sm text-emerald-500">All stock levels are healthy. 🎉</li>}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 pb-0"><SectionTitle title="Recent Orders" sub="Latest activity across all channels" action={<Link to="/app/orders" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-500 hover:underline">View all <ArrowRight size={13} /></Link>} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr className="text-left"><th className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Order</th><th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Customer</th><th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th><th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th><th className="px-5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</th></tr></thead>
              <tbody>
                {recentOrders.map(o => {
                  const c = customers.find(x => x.id === o.customerId)
                  return (
                    <tr key={o.id} className="border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-white/[0.05] dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-3"><Link to={`/app/orders/${o.id}`} className="font-mono text-[13px] font-semibold text-brand-600 hover:underline dark:text-brand-300">{o.id}</Link></td>
                      <td className="px-3 py-3"><span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><Avatar name={c?.name ?? '—'} size={26} />{c?.name ?? 'Deleted customer'}</span></td>
                      <td className="px-3 py-3 text-sm text-slate-500">{fmtDate(o.date)}</td>
                      <td className="px-3 py-3"><Badge tone={orderTone(o.status)}>{o.status}</Badge></td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(o.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Recent Activity" sub="Latest events in your workspace" />
          <ul className="relative space-y-4 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-slate-200 dark:before:bg-white/[0.08]">
            {activities.slice(0, 7).map(a => (
              <li key={a.id} className="relative flex gap-3.5 pl-0.5">
                <span className="z-10 mt-1 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-500"><ActivityIcon size={9} /></span>
                <div className="min-w-0"><p className="text-[13px] leading-snug text-slate-700 dark:text-slate-200">{a.label}</p><p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(a.date)}</p></div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-white">Business summary</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              In the last {period} days you generated <strong className="text-slate-800 dark:text-slate-100">{fmtMoney(m.revenue)}</strong> from <strong className="text-slate-800 dark:text-slate-100">{m.orders} orders</strong> at an estimated gross margin of <strong className="text-slate-800 dark:text-slate-100">{m.margin.toFixed(1)}%</strong>.
              {lowStock.length > 0 ? ` ${lowStock.length} product(s) need restocking attention.` : ' Inventory is fully healthy.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

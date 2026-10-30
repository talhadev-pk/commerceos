import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { computeMetrics, downloadCSV, fmtDate, fmtMoney, fmtNum } from '../../lib/utils'
import { Avatar, Badge, Card, Empty, PageHead, StatCard, btnGhost, cx, inputCls, payTone, rowCls, tdCls, thCls } from '../../components/ui'
import { ShoppingCart, DollarSign, Receipt, RotateCcw } from 'lucide-react'
import type { OrderStatus } from '../../types'

const PAGE_SIZE = 10
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']

export default function Orders() {
  const { orders, customers, updateOrderStatus, toast } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [days, setDays] = useState('all')
  const [page, setPage] = useState(1)

  const m = useMemo(() => computeMetrics(orders), [orders])
  const customerName = (id: string) => customers.find(c => c.id === id)?.name ?? 'Deleted customer'

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const cutoff = days === 'all' ? 0 : Date.now() - Number(days) * 86400000
    return orders.filter(o =>
      (!needle || o.id.toLowerCase().includes(needle) || customerName(o.customerId).toLowerCase().includes(needle)) &&
      (status === 'all' || o.status === status) &&
      new Date(o.date).getTime() >= cutoff)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, q, status, days, customers])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const exportCSV = () => {
    downloadCSV('commerceos-orders.csv', ['Order ID', 'Customer', 'Date', 'Items', 'Subtotal', 'Discount', 'Shipping', 'Total', 'Status', 'Payment', 'Channel'],
      filtered.map(o => [o.id, customerName(o.customerId), o.date.slice(0, 10), o.items.reduce((s, i) => s + i.qty, 0), o.subtotal, o.discount, o.shipping, o.total, o.status, o.payment, o.channel]))
    toast(`Exported ${filtered.length} orders to CSV.`)
  }

  return (
    <div>
      <PageHead title="Orders" sub="Track, fulfil and manage every simulated order. Status changes update metrics across the platform instantly."
        action={<button className={btnGhost} onClick={exportCSV}><Download size={15} /> Export orders</button>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders (all time)" value={fmtNum(orders.length)} icon={ShoppingCart} hint={`${orders.filter(o => o.status === 'pending').length} awaiting confirmation`} />
        <StatCard label="Revenue (all time)" value={fmtMoney(m.revenue)} icon={DollarSign} hint="Excludes cancelled & returned" />
        <StatCard label="Average Order Value" value={fmtMoney(m.aov)} icon={Receipt} hint={`${fmtNum(m.units)} units sold`} />
        <StatCard label="Returns & Refunds" value={fmtMoney(m.refunds)} icon={RotateCcw} hint={`${orders.filter(o => o.status === 'returned').length} returned orders`} />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search by order ID (COS-1042) or customer…" aria-label="Search orders" className={cx(inputCls, 'pl-10')} />
          </label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} aria-label="Status filter" className={cx(inputCls, 'w-auto')}>
            <option value="all">All statuses</option>{ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={days} onChange={e => { setDays(e.target.value); setPage(1) }} aria-label="Date filter" className={cx(inputCls, 'w-auto')}>
            <option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
          </select>
        </div>
        {rows.length === 0 ? <Empty title="No orders found" body="No orders match the current search and filters." action={<button className={btnGhost} onClick={() => { setQ(''); setStatus('all'); setDays('all') }}>Clear filters</button>} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead><tr><th className={thCls}>Order</th><th className={thCls}>Customer</th><th className={thCls}>Date</th><th className={thCls}>Items</th><th className={thCls}>Channel</th><th className={thCls}>Payment</th><th className={thCls}>Status</th><th className={thCls}>Total</th><th className={thCls}>View</th></tr></thead>
              <tbody>
                {rows.map(o => (
                  <tr key={o.id} className={rowCls}>
                    <td className={tdCls}><Link to={`/app/orders/${o.id}`} className="font-mono text-[13px] font-semibold text-brand-600 hover:underline dark:text-brand-300">{o.id}</Link></td>
                    <td className={tdCls}><span className="flex items-center gap-2.5"><Avatar name={customerName(o.customerId)} size={28} />{customerName(o.customerId)}</span></td>
                    <td className={cx(tdCls, 'whitespace-nowrap text-slate-500')}>{fmtDate(o.date)}</td>
                    <td className={tdCls}>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className={tdCls}>{o.channel}</td>
                    <td className={tdCls}><Badge tone={payTone(o.payment)}>{o.payment}</Badge></td>
                    <td className={tdCls}>
                      <select value={o.status} aria-label={`Update status for ${o.id}`}
                        onChange={e => { updateOrderStatus(o.id, e.target.value as OrderStatus); toast(`Order ${o.id} moved to ${e.target.value}.`) }}
                        className="rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-[13px] font-medium capitalize dark:border-white/10">
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{fmtMoney(o.total)}</td>
                    <td className={tdCls}><Link to={`/app/orders/${o.id}`} aria-label={`View order ${o.id}`} className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10"><Eye size={15} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
            <p className="text-sm text-slate-400">Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, safePage * PAGE_SIZE)} of {filtered.length} orders</p>
            <div className="flex items-center gap-1.5">
              <button className={btnGhost + ' !px-3 !py-2'} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button>
              <span className="px-2 text-sm text-slate-500">Page {safePage} of {pages}</span>
              <button className={btnGhost + ' !px-3 !py-2'} disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

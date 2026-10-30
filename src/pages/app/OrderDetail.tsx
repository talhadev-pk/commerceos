import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle2, Circle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { fmtDate, fmtDateTime, fmtMoney } from '../../lib/utils'
import { Avatar, Badge, Card, Empty, SectionTitle, btnGhost, btnPrimary, cx, orderTone, payTone, rowCls, tdCls, thCls } from '../../components/ui'
import { ORDER_STATUSES } from './Orders'
import type { OrderStatus } from '../../types'

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

export default function OrderDetail() {
  const { id } = useParams()
  const { orders, customers, products, updateOrderStatus, toast, settings } = useStore()
  const order = orders.find(o => o.id === id)
  if (!order) {
    return <Card><Empty title="Order not found" body="This order ID does not exist in the demonstration dataset." action={<Link to="/app/orders" className={btnPrimary}>Back to orders</Link>} /></Card>
  }
  const customer = customers.find(c => c.id === order.customerId)
  const flowIdx = FLOW.indexOf(order.status)
  const terminated = order.status === 'cancelled' || order.status === 'returned'

  return (
    <div>
      <div className="no-print">
        <Link to="/app/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-500"><ArrowLeft size={15} /> Back to orders</Link>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-[26px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[30px]">
              Order <span className="font-mono">{order.id}</span> <Badge tone={orderTone(order.status)}>{order.status}</Badge> <Badge tone={payTone(order.payment)}>Payment: {order.payment}</Badge>
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Placed {fmtDateTime(order.date)} via {order.channel} · Simulated transaction — no real payment was processed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={order.status} aria-label="Update order status"
              onChange={e => { updateOrderStatus(order.id, e.target.value as OrderStatus); toast(`Order ${order.id} moved to ${e.target.value}.`) }}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium capitalize dark:border-white/10 dark:bg-white/[0.04]">
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className={btnGhost} onClick={() => window.print()}><Printer size={15} /> Print summary</button>
          </div>
        </div>

        {!terminated && (
          <Card className="mb-4 p-5">
            <ol className="flex items-center" aria-label="Fulfilment progress">
              {FLOW.map((s, i) => (
                <li key={s} className={cx('flex items-center', i < FLOW.length - 1 && 'flex-1')}>
                  <span className="flex flex-col items-center gap-1.5">
                    {i <= flowIdx ? <CheckCircle2 size={22} className="text-brand-500" /> : <Circle size={22} className="text-slate-300 dark:text-slate-600" />}
                    <span className={cx('text-[11px] font-medium capitalize', i <= flowIdx ? 'text-slate-800 dark:text-white' : 'text-slate-400')}>{s}</span>
                  </span>
                  {i < FLOW.length - 1 && <span className={cx('mx-2 mb-5 h-0.5 flex-1 rounded', i < flowIdx ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10')} />}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <div id="print-area" className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 pb-2"><SectionTitle title="Order Items" sub={`${order.items.reduce((s, i) => s + i.qty, 0)} units across ${order.items.length} product lines`} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr><th className={thCls}>Product</th><th className={thCls}>SKU</th><th className={thCls}>Unit price</th><th className={thCls}>Qty</th><th className={thCls}>Line total</th></tr></thead>
              <tbody>
                {order.items.map(it => (
                  <tr key={it.productId} className={rowCls}>
                    <td className={tdCls}><span className="font-medium text-slate-900 dark:text-white">{it.name}</span>{!products.some(p => p.id === it.productId) && <span className="ml-2 text-xs text-slate-400">(product removed from catalog)</span>}</td>
                    <td className={cx(tdCls, 'font-mono text-[12px]')}>{it.sku}</td>
                    <td className={tdCls}>{fmtMoney(it.unitPrice)}</td>
                    <td className={tdCls}>{it.qty}</td>
                    <td className={cx(tdCls, 'font-semibold')}>{fmtMoney(it.qty * it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="space-y-2 border-t border-slate-100 p-5 text-sm dark:border-white/[0.06]">
            <div className="flex justify-between"><dt className="text-slate-400">Subtotal</dt><dd className="font-medium">{fmtMoney(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Discount</dt><dd className="font-medium text-emerald-500">−{fmtMoney(order.discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Shipping</dt><dd className="font-medium">{order.shipping === 0 ? 'Free' : fmtMoney(order.shipping)}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-2.5 text-base dark:border-white/[0.06]"><dt className="font-semibold text-slate-900 dark:text-white">Total</dt><dd className="font-bold text-slate-900 dark:text-white">{fmtMoney(order.total)}</dd></div>
          </dl>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title="Customer" />
            {customer ? (
              <>
                <Link to={`/app/customers/${customer.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  <Avatar name={customer.name} size={44} />
                  <span><span className="block font-semibold text-slate-900 dark:text-white">{customer.name}</span><span className="block text-sm text-slate-400">{customer.email}</span></span>
                </Link>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-400">Phone</dt><dd>{customer.phone}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Location</dt><dd>{customer.city}, {customer.country}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Segment</dt><dd><Badge tone="indigo">{customer.segment}</Badge></dd></div>
                </dl>
              </>
            ) : <p className="text-sm text-slate-400">Customer record was deleted. Order data is preserved for reporting integrity.</p>}
          </Card>
          <Card className="p-5">
            <SectionTitle title="Order Timeline" />
            <ul className="space-y-3.5">
              {order.history.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
                  <span><span className="block text-sm font-medium capitalize text-slate-800 dark:text-slate-100">{h.label}</span><span className="text-xs text-slate-400">{fmtDate(h.at)}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-400 dark:bg-white/[0.04]">{settings.storeName} · Demonstration order summary generated by CommerceOS. No real payment, shipment or personal data is involved.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

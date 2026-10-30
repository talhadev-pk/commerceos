import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, CalendarDays } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { fmtDate, fmtMoney } from '../../lib/utils'
import { Avatar, Badge, Card, Empty, SectionTitle, btnPrimary, cx, orderTone, payTone, rowCls, tdCls, thCls } from '../../components/ui'

export default function CustomerDetail() {
  const { id } = useParams()
  const { customers, orders, upsertCustomer, toast } = useStore()
  const customer = customers.find(c => c.id === id)
  if (!customer) return <Card><Empty title="Customer not found" body="This customer record does not exist (it may have been deleted)." action={<Link to="/app/customers" className={btnPrimary}>Back to customers</Link>} /></Card>

  const mine = orders.filter(o => o.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date))
  const live = mine.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
  const spend = live.reduce((s, o) => s + o.total, 0)

  return (
    <div>
      <Link to="/app/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-500"><ArrowLeft size={15} /> Back to customers</Link>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} size={60} />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{customer.name}</h1>
              <div className="mt-1.5 flex gap-1.5"><Badge tone={customer.status === 'vip' ? 'indigo' : customer.status === 'active' ? 'green' : 'slate'}>{customer.status}</Badge><Badge tone="blue">{customer.segment}</Badge></div>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2.5"><Mail size={15} className="text-slate-400" />{customer.email}</li>
            <li className="flex items-center gap-2.5"><Phone size={15} className="text-slate-400" />{customer.phone || '—'}</li>
            <li className="flex items-center gap-2.5"><MapPin size={15} className="text-slate-400" />{customer.city}, {customer.country}</li>
            <li className="flex items-center gap-2.5"><CalendarDays size={15} className="text-slate-400" />Customer since {fmtDate(customer.joinedAt)}</li>
          </ul>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[['Orders', String(live.length)], ['Total spend', fmtMoney(spend)], ['Avg. order', fmtMoney(live.length ? spend / live.length : 0)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.04]"><p className="text-[15px] font-bold text-slate-900 dark:text-white">{v}</p><p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{k}</p></div>
            ))}
          </div>
          <div className="mt-6">
            <label htmlFor="notes" className="mb-1.5 block text-[13px] font-medium text-slate-600 dark:text-slate-300">Customer notes</label>
            <textarea id="notes" rows={3} defaultValue={customer.notes} placeholder="Add internal notes about this customer…"
              onBlur={e => { if (e.target.value !== customer.notes) { upsertCustomer({ ...customer, notes: e.target.value }); toast('Customer notes saved.') } }}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
            <p className="mt-1 text-xs text-slate-400">Notes save automatically when you click away.</p>
          </div>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 pb-2"><SectionTitle title="Order History" sub={`${mine.length} orders placed (simulated transactions)`} /></div>
          {mine.length === 0 ? <Empty title="No orders yet" body="This customer has not placed any orders in the demonstration dataset." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead><tr><th className={thCls}>Order</th><th className={thCls}>Date</th><th className={thCls}>Items</th><th className={thCls}>Status</th><th className={thCls}>Payment</th><th className={cx(thCls, 'text-right')}>Total</th></tr></thead>
                <tbody>
                  {mine.map(o => (
                    <tr key={o.id} className={rowCls}>
                      <td className={tdCls}><Link to={`/app/orders/${o.id}`} className="font-mono text-[13px] font-semibold text-brand-600 hover:underline dark:text-brand-300">{o.id}</Link></td>
                      <td className={cx(tdCls, 'whitespace-nowrap text-slate-500')}>{fmtDate(o.date)}</td>
                      <td className={tdCls}>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                      <td className={tdCls}><Badge tone={orderTone(o.status)}>{o.status}</Badge></td>
                      <td className={tdCls}><Badge tone={payTone(o.payment)}>{o.payment}</Badge></td>
                      <td className={cx(tdCls, 'text-right font-semibold')}>{fmtMoney(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

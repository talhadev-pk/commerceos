import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Eye, Users, Crown, UserPlus, DollarSign } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { customerStats, fmtDate, fmtMoney, fmtNum, uid } from '../../lib/utils'
import { Avatar, Badge, Card, Confirm, Empty, Modal, PageHead, StatCard, btnGhost, btnPrimary, cx, inputCls, labelCls, rowCls, tdCls, thCls } from '../../components/ui'
import type { Customer } from '../../types'

const blank = (): Customer => ({ id: uid('cus'), name: '', email: '', phone: '', city: '', country: '', status: 'active', segment: 'New', notes: '', joinedAt: new Date().toISOString() })

export default function Customers() {
  const { customers, orders, upsertCustomer, deleteCustomer, toast } = useStore()
  const [q, setQ] = useState('')
  const [segment, setSegment] = useState('all')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [confirmDel, setConfirmDel] = useState<Customer | null>(null)
  const [error, setError] = useState('')

  const stats = useMemo(() => customerStats(orders, customers), [orders, customers])
  const statOf = (id: string) => stats.find(s => s.customer.id === id)
  const totalSpend = stats.reduce((s, x) => s + x.spend, 0)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return stats.filter(({ customer }) => (!needle || `${customer.name} ${customer.email} ${customer.city}`.toLowerCase().includes(needle)) && (segment === 'all' || customer.segment === segment))
  }, [stats, q, segment])

  const save = () => {
    if (!editing) return
    if (editing.name.trim().length < 2) { setError('Enter the customer’s full name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email.trim())) { setError('Enter a valid email address.'); return }
    if (customers.some(c => c.email.toLowerCase() === editing.email.trim().toLowerCase() && c.id !== editing.id)) { setError('Another customer already uses this email.'); return }
    setError('')
    upsertCustomer({ ...editing, name: editing.name.trim(), email: editing.email.trim() })
    toast(`Customer "${editing.name.trim()}" saved.`)
    setEditing(null)
  }
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEditing(c => (c ? { ...c, [k]: e.target.value } : c))

  return (
    <div>
      <PageHead title="Customers" sub="Synthetic demonstration records only — no real personal information. Spending is computed live from order history."
        action={<button className={btnPrimary} onClick={() => { setEditing(blank()); setError('') }}><Plus size={16} /> Add Customer</button>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Customers" value={fmtNum(customers.length)} icon={Users} hint={`${customers.filter(c => c.segment === 'New').length} new this cycle`} />
        <StatCard label="VIP Customers" value={fmtNum(customers.filter(c => c.status === 'vip').length)} icon={Crown} hint="Highest lifetime value" />
        <StatCard label="Lifetime Customer Spend" value={fmtMoney(totalSpend)} icon={DollarSign} hint="Across all demo orders" />
        <StatCard label="Avg. Spend / Customer" value={fmtMoney(customers.length ? totalSpend / customers.length : 0)} icon={UserPlus} hint={`${customers.filter(c => c.segment === 'Loyal').length} loyal customers`} />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email or city…" aria-label="Search customers" className={cx(inputCls, 'pl-10')} />
          </label>
          <select value={segment} onChange={e => setSegment(e.target.value)} aria-label="Segment filter" className={cx(inputCls, 'w-auto')}>
            <option value="all">All segments</option><option>New</option><option>Returning</option><option>Loyal</option><option>At Risk</option>
          </select>
        </div>
        {rows.length === 0 ? <Empty title="No customers found" body="Try a different search, or add a new customer." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead><tr><th className={thCls}>Customer</th><th className={thCls}>Location</th><th className={thCls}>Segment</th><th className={thCls}>Orders</th><th className={thCls}>Total spend</th><th className={thCls}>Last purchase</th><th className={thCls}>Status</th><th className={thCls}>Actions</th></tr></thead>
              <tbody>
                {rows.map(({ customer, orders: count, spend, lastPurchase }) => (
                  <tr key={customer.id} className={rowCls}>
                    <td className={tdCls}><span className="flex items-center gap-3"><Avatar name={customer.name} /><span><span className="block font-medium text-slate-900 dark:text-white">{customer.name}</span><span className="text-xs text-slate-400">{customer.email}</span></span></span></td>
                    <td className={tdCls}>{customer.city}, {customer.country}</td>
                    <td className={tdCls}><Badge tone={customer.segment === 'Loyal' ? 'green' : customer.segment === 'At Risk' ? 'red' : customer.segment === 'New' ? 'blue' : 'indigo'}>{customer.segment}</Badge></td>
                    <td className={tdCls}>{count}</td>
                    <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{fmtMoney(spend)}</td>
                    <td className={cx(tdCls, 'whitespace-nowrap text-slate-500')}>{lastPurchase ? fmtDate(lastPurchase) : '—'}</td>
                    <td className={tdCls}><Badge tone={customer.status === 'vip' ? 'indigo' : customer.status === 'active' ? 'green' : 'slate'}>{customer.status}</Badge></td>
                    <td className={tdCls}><span className="flex gap-1">
                      <Link to={`/app/customers/${customer.id}`} aria-label={`View ${customer.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10"><Eye size={15} /></Link>
                      <button onClick={() => { setEditing({ ...customer }); setError('') }} aria-label={`Edit ${customer.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10"><Pencil size={15} /></button>
                      <button onClick={() => setConfirmDel(customer)} aria-label={`Delete ${customer.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 size={15} /></button>
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && statOf(editing.id) ? 'Edit Customer' : 'Add Customer'}>
        {editing && (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); save() }} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="c-name" className={labelCls}>Full name *</label><input id="c-name" value={editing.name} onChange={set('name')} className={inputCls} placeholder="e.g. Jordan Ellis" /></div>
              <div><label htmlFor="c-email" className={labelCls}>Email *</label><input id="c-email" type="email" value={editing.email} onChange={set('email')} className={inputCls} placeholder="name@example.com" /></div>
              <div><label htmlFor="c-phone" className={labelCls}>Phone</label><input id="c-phone" value={editing.phone} onChange={set('phone')} className={inputCls} placeholder="+44 …" /></div>
              <div><label htmlFor="c-city" className={labelCls}>City</label><input id="c-city" value={editing.city} onChange={set('city')} className={inputCls} /></div>
              <div><label htmlFor="c-country" className={labelCls}>Country</label><input id="c-country" value={editing.country} onChange={set('country')} className={inputCls} /></div>
              <div><label htmlFor="c-status" className={labelCls}>Status</label>
                <select id="c-status" value={editing.status} onChange={set('status')} className={inputCls}><option value="active">Active</option><option value="vip">VIP</option><option value="inactive">Inactive</option></select></div>
              <div><label htmlFor="c-seg" className={labelCls}>Segment</label>
                <select id="c-seg" value={editing.segment} onChange={set('segment')} className={inputCls}><option>New</option><option>Returning</option><option>Loyal</option><option>At Risk</option></select></div>
            </div>
            <div><label htmlFor="c-notes" className={labelCls}>Notes</label><textarea id="c-notes" rows={2} value={editing.notes} onChange={set('notes')} className={cx(inputCls, 'resize-none')} placeholder="Preferences, context, follow-ups…" /></div>
            {error && <p className="rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-500" role="alert">{error}</p>}
            <div className="flex justify-end gap-2 pt-1"><button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancel</button><button type="submit" className={btnPrimary}>Save customer</button></div>
          </form>
        )}
      </Modal>

      <Confirm open={!!confirmDel} title="Delete customer?" body={`"${confirmDel?.name}" will be removed. Their historical orders remain for reporting integrity but will show as a deleted customer.`}
        onCancel={() => setConfirmDel(null)} onConfirm={() => { if (confirmDel) deleteCustomer(confirmDel.id); toast('Customer deleted.'); setConfirmDel(null) }} />
    </div>
  )
}

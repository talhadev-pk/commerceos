import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Truck, Globe2, Clock3, Package } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CATEGORIES } from '../../data/seed'
import { fmtMoney, fmtNum, uid } from '../../lib/utils'
import { Avatar, Badge, Card, Confirm, Empty, Modal, PageHead, btnGhost, btnPrimary, cx, inputCls, labelCls } from '../../components/ui'
import type { Supplier } from '../../types'

const blank = (): Supplier => ({ id: uid('sup'), name: '', contact: '', email: '', phone: '', country: '', categories: ['Electronics'], status: 'active', leadTimeDays: 7, notes: '' })

export default function Suppliers() {
  const { suppliers, products, upsertSupplier, deleteSupplier, toast } = useStore()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [confirmDel, setConfirmDel] = useState<Supplier | null>(null)
  const [error, setError] = useState('')

  const enriched = useMemo(() => suppliers.map(s => {
    const mine = products.filter(p => p.supplierId === s.id)
    return { supplier: s, count: mine.length, stockValue: mine.reduce((sum, p) => sum + p.stock * p.cost, 0), lowCount: mine.filter(p => p.stock <= p.reorderLevel).length }
  }), [suppliers, products])

  const rows = enriched.filter(({ supplier }) => !q.trim() || `${supplier.name} ${supplier.contact} ${supplier.country}`.toLowerCase().includes(q.trim().toLowerCase()))

  const save = () => {
    if (!editing) return
    if (editing.name.trim().length < 2) { setError('Enter the supplier company name.'); return }
    if (editing.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email.trim())) { setError('Enter a valid business email, or leave it blank.'); return }
    if (!editing.categories.length) { setError('Select at least one supplied category.'); return }
    setError(''); upsertSupplier({ ...editing, name: editing.name.trim(), leadTimeDays: Math.max(1, Math.floor(Number(editing.leadTimeDays)) || 7) })
    toast(`Supplier "${editing.name.trim()}" saved.`); setEditing(null)
  }
  const set = (k: keyof Supplier) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEditing(s => (s ? { ...s, [k]: e.target.value } : s))
  const toggleCat = (c: string) => setEditing(s => (s ? { ...s, categories: s.categories.includes(c) ? s.categories.filter(x => x !== c) : [...s.categories, c] } : s))

  return (
    <div>
      <PageHead title="Suppliers" sub="Fictional demonstration suppliers. Product counts and stock values update live from your catalog."
        action={<button className={btnPrimary} onClick={() => { setEditing(blank()); setError('') }}><Plus size={16} /> Add Supplier</button>} />

      <Card className="mb-4 p-4">
        <label className="relative block max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search suppliers…" aria-label="Search suppliers" className={cx(inputCls, 'pl-10')} />
        </label>
      </Card>

      {rows.length === 0 ? <Card><Empty title="No suppliers found" body="Try a different search term or add a new supplier." /></Card> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ supplier: s, count, stockValue, lowCount }) => (
            <Card key={s.id} className="p-5 transition hover:border-brand-500/25">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} size={44} />
                  <div><h3 className="font-semibold leading-tight text-slate-900 dark:text-white">{s.name}</h3><p className="mt-0.5 text-[13px] text-slate-400">{s.contact} · {s.email}</p></div>
                </div>
                <Badge tone={s.status === 'active' ? 'green' : 'slate'}>{s.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">{s.categories.map(c => <Badge key={c} tone="indigo">{c}</Badge>)}</div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/[0.04]"><Package size={14} className="mx-auto text-slate-400" /><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{count}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Products</p></div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/[0.04]"><Clock3 size={14} className="mx-auto text-slate-400" /><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{s.leadTimeDays}d</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Lead time</p></div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/[0.04]"><Globe2 size={14} className="mx-auto text-slate-400" /><p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{s.country}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Country</p></div>
              </dl>
              <p className="mt-3.5 flex items-center justify-between text-[13px] text-slate-500 dark:text-slate-400">
                <span>Stock value supplied: <strong className="text-slate-800 dark:text-slate-100">{fmtMoney(stockValue)}</strong></span>
                {lowCount > 0 && <Badge tone="amber">{lowCount} low</Badge>}
              </p>
              {s.notes && <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{s.notes}</p>}
              <div className="mt-4 flex gap-2">
                <button className={cx(btnGhost, 'flex-1 !py-2 text-[13px]')} onClick={() => { setEditing({ ...s }); setError('') }}><Pencil size={13} /> Edit</button>
                <button className={cx(btnGhost, '!px-3 !py-2 text-rose-500')} onClick={() => setConfirmDel(s)} aria-label={`Delete ${s.name}`}><Trash2 size={13} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Truck size={15} /> {fmtNum(suppliers.filter(s => s.status === 'active').length)} active suppliers across {fmtNum(new Set(suppliers.map(s => s.country)).size)} countries.</p>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && suppliers.some(s => s.id === editing.id) ? 'Edit Supplier' : 'Add Supplier'}>
        {editing && (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); save() }} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="s-name" className={labelCls}>Company name *</label><input id="s-name" value={editing.name} onChange={set('name')} className={inputCls} placeholder="e.g. Vertex Supply Co" /></div>
              <div><label htmlFor="s-contact" className={labelCls}>Business contact</label><input id="s-contact" value={editing.contact} onChange={set('contact')} className={inputCls} /></div>
              <div><label htmlFor="s-email" className={labelCls}>Email</label><input id="s-email" type="email" value={editing.email} onChange={set('email')} className={inputCls} placeholder="orders@supplier.example" /></div>
              <div><label htmlFor="s-phone" className={labelCls}>Phone</label><input id="s-phone" value={editing.phone} onChange={set('phone')} className={inputCls} /></div>
              <div><label htmlFor="s-country" className={labelCls}>Country</label><input id="s-country" value={editing.country} onChange={set('country')} className={inputCls} /></div>
              <div><label htmlFor="s-lead" className={labelCls}>Lead time (days)</label><input id="s-lead" type="number" min="1" value={editing.leadTimeDays} onChange={set('leadTimeDays')} className={inputCls} /></div>
              <div><label htmlFor="s-status" className={labelCls}>Status</label>
                <select id="s-status" value={editing.status} onChange={set('status')} className={inputCls}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <fieldset>
              <legend className={labelCls}>Supplied categories *</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button type="button" key={c} onClick={() => toggleCat(c)} aria-pressed={editing.categories.includes(c)}
                    className={cx('rounded-full border px-3 py-1.5 text-[13px] font-medium transition', editing.categories.includes(c) ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-200' : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10')}>{c}</button>
                ))}
              </div>
            </fieldset>
            <div><label htmlFor="s-notes" className={labelCls}>Notes</label><textarea id="s-notes" rows={2} value={editing.notes} onChange={set('notes')} className={cx(inputCls, 'resize-none')} /></div>
            {error && <p className="rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-500" role="alert">{error}</p>}
            <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancel</button><button type="submit" className={btnPrimary}>Save supplier</button></div>
          </form>
        )}
      </Modal>

      <Confirm open={!!confirmDel} title="Delete supplier?" body={`"${confirmDel?.name}" will be removed. Products linked to this supplier keep their data but will show no supplier until reassigned.`}
        onCancel={() => setConfirmDel(null)} onConfirm={() => { if (confirmDel) deleteSupplier(confirmDel.id); toast('Supplier deleted.'); setConfirmDel(null) }} />
    </div>
  )
}

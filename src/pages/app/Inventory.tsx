import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Boxes, AlertTriangle, PackageX, DollarSign, SlidersHorizontal, History, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { downloadCSV, fmtDate, fmtMoney, fmtNum, stockState } from '../../lib/utils'
import { Badge, Card, Empty, Modal, PageHead, ProductVisual, SectionTitle, StatCard, btnGhost, btnPrimary, cx, inputCls, labelCls, rowCls, tdCls, thCls } from '../../components/ui'
import type { Product } from '../../types'

export default function Inventory() {
  const { products, suppliers, movements, adjustStock, setReorderLevel, toast } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('Supplier delivery received')
  const [thresholdDraft, setThresholdDraft] = useState<Record<string, string>>({})

  const value = products.reduce((s, p) => s + p.stock * p.cost, 0)
  const retailValue = products.reduce((s, p) => s + p.stock * p.price, 0)
  const low = products.filter(p => stockState(p) === 'low')
  const out = products.filter(p => stockState(p) === 'out')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return products
      .filter(p => (!needle || `${p.name} ${p.sku}`.toLowerCase().includes(needle)) && (filter === 'all' || stockState(p) === filter))
      .sort((a, b) => a.stock - b.stock)
  }, [products, q, filter])

  const doAdjust = () => {
    if (!adjusting) return
    const d = Number(delta)
    if (!Number.isInteger(d) || d === 0) { toast('Enter a whole-number adjustment (e.g. +25 or -4).', 'error'); return }
    if (adjustStock(adjusting.id, d, reason)) {
      toast(`Stock for "${adjusting.name}" ${d > 0 ? 'increased' : 'decreased'} by ${Math.abs(d)}. Dashboard & valuation updated.`)
      setAdjusting(null); setDelta('')
    }
  }

  const exportCSV = () => {
    downloadCSV('commerceos-inventory.csv', ['Product', 'SKU', 'Category', 'Stock', 'Reserved', 'Available', 'Reorder Level', 'Unit Cost', 'Stock Value'],
      products.map(p => [p.name, p.sku, p.category, p.stock, p.reserved, Math.max(0, p.stock - p.reserved), p.reorderLevel, p.cost, (p.stock * p.cost).toFixed(2)]))
    toast('Inventory snapshot exported to CSV.')
  }

  return (
    <div>
      <PageHead title="Inventory" sub="Stock control, valuation, replenishment and movement history — all adjustments update dashboard metrics instantly."
        action={<button className={btnGhost} onClick={exportCSV}><Download size={15} /> Export snapshot</button>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inventory Value (at cost)" value={fmtMoney(value)} icon={DollarSign} hint={`${fmtMoney(retailValue)} at retail prices`} />
        <StatCard label="Units in Stock" value={fmtNum(products.reduce((s, p) => s + p.stock, 0))} icon={Boxes} hint={`${fmtNum(products.reduce((s, p) => s + p.reserved, 0))} reserved for orders`} />
        <StatCard label="Low-Stock Products" value={fmtNum(low.length)} icon={AlertTriangle} hint="At or below reorder level" />
        <StatCard label="Out of Stock" value={fmtNum(out.length)} icon={PackageX} hint="Replenishment required urgently" />
      </div>

      {(low.length > 0 || out.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-700 dark:text-amber-300" role="alert">
          <AlertTriangle size={16} className="shrink-0" />
          <span><strong>{out.length} out of stock</strong> and <strong>{low.length} running low</strong>. Use “Adjust stock” to record a replenishment delivery.</span>
        </div>
      )}

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search inventory by name or SKU…" aria-label="Search inventory" className={cx(inputCls, 'pl-10')} />
          </label>
          <div className="flex rounded-xl border border-slate-200 p-1 dark:border-white/10" role="group" aria-label="Stock filter">
            {[['all', 'All'], ['healthy', 'Healthy'], ['low', 'Low'], ['out', 'Out']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} aria-pressed={filter === v} className={cx('rounded-lg px-3 py-1.5 text-[13px] font-medium transition', filter === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>{l}</button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? <Empty title="No inventory matches" body="Try a different search or stock filter." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead><tr><th className={thCls}>Product</th><th className={thCls}>Supplier</th><th className={thCls}>In stock</th><th className={thCls}>Reserved</th><th className={thCls}>Available</th><th className={thCls}>Health</th><th className={thCls}>Reorder level</th><th className={thCls}>Value (cost)</th><th className={thCls}>Action</th></tr></thead>
              <tbody>
                {rows.map(p => {
                  const state = stockState(p)
                  const available = Math.max(0, p.stock - p.reserved)
                  return (
                    <tr key={p.id} className={rowCls}>
                      <td className={tdCls}><span className="flex items-center gap-3"><ProductVisual product={p} size="sm" /><span><span className="block font-medium text-slate-900 dark:text-white">{p.name}</span><span className="font-mono text-[11px] text-slate-400">{p.sku}</span></span></span></td>
                      <td className={cx(tdCls, 'max-w-[150px] truncate')}>{suppliers.find(s => s.id === p.supplierId)?.name ?? '—'}</td>
                      <td className={cx(tdCls, 'font-bold text-slate-900 dark:text-white')}>{p.stock}</td>
                      <td className={tdCls}>{p.reserved}</td>
                      <td className={tdCls}>{available}</td>
                      <td className={tdCls}>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                            <motion.span className={cx('block h-full', state === 'out' ? 'bg-rose-500' : state === 'low' ? 'bg-amber-500' : 'bg-emerald-500')} animate={{ width: `${Math.min(100, (p.stock / Math.max(p.reorderLevel * 4, 1)) * 100)}%` }} transition={{ duration: 0.5 }} />
                          </span>
                          <Badge tone={state === 'out' ? 'red' : state === 'low' ? 'amber' : 'green'}>{state === 'out' ? 'Out' : state === 'low' ? 'Low' : 'Healthy'}</Badge>
                        </span>
                      </td>
                      <td className={tdCls}>
                        <span className="flex items-center gap-1.5">
                          <input type="number" min="0" aria-label={`Reorder level for ${p.name}`} value={thresholdDraft[p.id] ?? String(p.reorderLevel)}
                            onChange={e => setThresholdDraft(d => ({ ...d, [p.id]: e.target.value }))}
                            onBlur={e => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== p.reorderLevel) { setReorderLevel(p.id, v); toast(`Reorder level for "${p.name}" set to ${Math.max(0, Math.floor(v))}.`) } }}
                            className="w-[72px] rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-sm dark:border-white/10" />
                        </span>
                      </td>
                      <td className={cx(tdCls, 'font-medium')}>{fmtMoney(p.stock * p.cost)}</td>
                      <td className={tdCls}><button className={cx(btnGhost, '!px-3 !py-1.5 text-[13px]')} onClick={() => { setAdjusting(p); setDelta('') }}><SlidersHorizontal size={13} /> Adjust</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="p-5 pb-2"><SectionTitle title="Stock Movement History" sub="Every delivery, fulfilment, return and manual adjustment" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead><tr><th className={thCls}>Date</th><th className={thCls}>Product</th><th className={thCls}>Type</th><th className={thCls}>Change</th><th className={thCls}>Reason</th><th className={thCls}>Reference</th></tr></thead>
            <tbody>
              {movements.slice(0, 14).map(m => {
                const p = products.find(x => x.id === m.productId)
                return (
                  <tr key={m.id} className={rowCls}>
                    <td className={cx(tdCls, 'whitespace-nowrap text-slate-500')}>{fmtDate(m.date)}</td>
                    <td className={tdCls}>{p?.name ?? 'Removed product'}</td>
                    <td className={tdCls}><Badge tone={m.type === 'in' ? 'green' : m.type === 'return' ? 'teal' : m.type === 'out' ? 'red' : 'amber'}>{m.type === 'in' ? 'Stock in' : m.type === 'out' ? 'Stock out' : m.type}</Badge></td>
                    <td className={tdCls}><span className={cx('inline-flex items-center gap-1 font-semibold', m.qty >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{m.qty >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{m.qty >= 0 ? '+' : ''}{m.qty}</span></td>
                    <td className={tdCls}>{m.reason}</td>
                    <td className={cx(tdCls, 'font-mono text-[12px] text-slate-400')}>{m.reference}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="flex items-center gap-2 px-5 py-4 text-xs text-slate-400"><History size={13} /> Showing the 14 most recent of {movements.length} movements. Manual adjustments appear here instantly.</p>
      </Card>

      <Modal open={!!adjusting} onClose={() => setAdjusting(null)} title="Adjust Stock">
        {adjusting && (
          <div className="space-y-5">
            <div className="flex items-center gap-3"><ProductVisual product={adjusting} size="sm" /><div><p className="font-semibold text-slate-900 dark:text-white">{adjusting.name}</p><p className="text-sm text-slate-400">Currently {adjusting.stock} in stock · {adjusting.reserved} reserved</p></div></div>
            <div>
              <label htmlFor="delta" className={labelCls}>Adjustment (+ to add stock, − to remove)</label>
              <input id="delta" type="number" step="1" value={delta} onChange={e => setDelta(e.target.value)} placeholder="e.g. 25 or -4" className={inputCls} autoFocus />
              {delta && Number.isFinite(Number(delta)) && (
                <p className={cx('mt-2 text-sm font-medium', adjusting.stock + Number(delta) < 0 ? 'text-rose-500' : 'text-emerald-500')}>
                  {adjusting.stock + Number(delta) < 0 ? '⚠ This would make stock negative and will be rejected.' : `New stock level will be ${adjusting.stock + Number(delta)} units.`}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="reason" className={labelCls}>Reason</label>
              <select id="reason" value={reason} onChange={e => setReason(e.target.value)} className={inputCls}>
                <option>Supplier delivery received</option><option>Purchase order fulfilled</option><option>Cycle count correction</option>
                <option>Damaged units written off</option><option>Customer return restocked</option><option>Manual adjustment</option>
              </select>
            </div>
            <div className="flex justify-end gap-2"><button className={btnGhost} onClick={() => setAdjusting(null)}>Cancel</button><button className={btnPrimary} onClick={doAdjust}>Apply adjustment</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

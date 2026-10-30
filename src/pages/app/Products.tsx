import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, LayoutGrid, List, Pencil, Trash2, Eye, X, ChevronLeft, ChevronRight, ArrowUpDown, Download } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CATEGORIES } from '../../data/seed'
import { downloadCSV, fmtDate, fmtMoney, stockState } from '../../lib/utils'
import { Badge, Card, Confirm, Empty, Modal, PageHead, ProductVisual, btnGhost, btnPrimary, cx, inputCls, rowCls, tdCls, thCls } from '../../components/ui'
import type { Product } from '../../types'

const PAGE_SIZE = 9
type SortKey = 'name' | 'price' | 'stock' | 'createdAt'

export default function Products() {
  const { products, suppliers, deleteProducts, bulkSetProductStatus, toast } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [stock, setStock] = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'createdAt', dir: -1 })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<Product | null>(null)
  const [confirmDel, setConfirmDel] = useState<string[] | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let rows = products.filter(p =>
      (!needle || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(needle)) &&
      (cat === 'all' || p.category === cat) &&
      (statusF === 'all' || p.status === statusF) &&
      (stock === 'all' || stockState(p) === stock))
    rows = [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      return (typeof av === 'string' ? av.localeCompare(String(bv)) : Number(av) - Number(bv)) * sort.dir
    })
    return rows
  }, [products, q, cat, stock, statusF, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const toggleSort = (key: SortKey) => setSort(s => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))
  const toggleSel = (id: string) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  const resetPage = (fn: () => void) => () => { fn(); setPage(1) }

  const exportCSV = () => {
    downloadCSV('commerceos-products.csv', ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Status'],
      filtered.map(p => [p.name, p.sku, p.category, p.price, p.cost, p.stock, p.status]))
    toast(`Exported ${filtered.length} products to CSV.`)
  }

  const stockBadge = (p: Product) => {
    const s = stockState(p)
    return <Badge tone={s === 'out' ? 'red' : s === 'low' ? 'amber' : 'green'}>{s === 'out' ? 'Out of stock' : s === 'low' ? `Low · ${p.stock}` : `In stock · ${p.stock}`}</Badge>
  }

  return (
    <div>
      <PageHead title="Products" sub={`${products.length} products in your catalog · ${products.filter(p => p.status === 'active').length} active`}
        action={<div className="flex gap-2"><button className={btnGhost} onClick={exportCSV}><Download size={15} /> Export</button><Link to="/app/products/new" className={btnPrimary}><Plus size={16} /> Add Product</Link></div>} />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => resetPage(() => setQ(e.target.value))()} placeholder="Search by name, SKU or category…" aria-label="Search products" className={cx(inputCls, 'pl-10')} />
          </label>
          <select value={cat} onChange={e => resetPage(() => setCat(e.target.value))()} aria-label="Category filter" className={cx(inputCls, 'w-auto')}>
            <option value="all">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={stock} onChange={e => resetPage(() => setStock(e.target.value))()} aria-label="Stock filter" className={cx(inputCls, 'w-auto')}>
            <option value="all">Any stock</option><option value="healthy">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option>
          </select>
          <select value={statusF} onChange={e => resetPage(() => setStatusF(e.target.value))()} aria-label="Status filter" className={cx(inputCls, 'w-auto')}>
            <option value="all">Any status</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
          <select value={`${sort.key}:${sort.dir}`} onChange={e => { const [k, d] = e.target.value.split(':'); setSort({ key: k as SortKey, dir: Number(d) as 1 | -1 }) }} aria-label="Sort products" className={cx(inputCls, 'w-auto')}>
            <option value="createdAt:-1">Newest first</option><option value="name:1">Name A–Z</option><option value="price:-1">Price: high → low</option><option value="price:1">Price: low → high</option><option value="stock:-1">Stock: high → low</option><option value="stock:1">Stock: low → high</option>
          </select>
          <div className="ml-auto flex rounded-xl border border-slate-200 p-1 dark:border-white/10" role="group" aria-label="View mode">
            <button onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'} className={cx('rounded-lg p-2 transition', view === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white')}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('table')} aria-label="Table view" aria-pressed={view === 'table'} className={cx('rounded-lg p-2 transition', view === 'table' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white')}><List size={16} /></button>
          </div>
        </div>
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-brand-500/[0.08] px-4 py-3">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-200">{selected.length} selected</span>
                <span className="mx-1 h-4 w-px bg-brand-500/25" />
                <button className="text-[13px] font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300" onClick={() => { bulkSetProductStatus(selected, 'active'); toast('Selected products set to Active.'); setSelected([]) }}>Set Active</button>
                <button className="text-[13px] font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300" onClick={() => { bulkSetProductStatus(selected, 'archived'); toast('Selected products archived.'); setSelected([]) }}>Archive</button>
                <button className="text-[13px] font-medium text-rose-500 hover:underline" onClick={() => setConfirmDel(selected)}>Delete</button>
                <button className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setSelected([])} aria-label="Clear selection"><X size={15} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {filtered.length === 0 ? (
        <Card><Empty title="No products match your filters" body="Try a different search term or clear the filters to see the full catalog." action={<button className={btnPrimary} onClick={() => { setQ(''); setCat('all'); setStock('all'); setStatusF('all') }}>Clear filters</button>} /></Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {pageRows.map(p => (
              <motion.article key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.22 }}>
                <Card className="group overflow-hidden p-3 transition hover:shadow-lg hover:shadow-slate-900/[0.06] dark:hover:border-brand-500/25">
                  <div className="relative">
                    <ProductVisual product={p} />
                    <label className="absolute left-2.5 top-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-black/30 backdrop-blur transition hover:bg-black/50">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSel(p.id)} aria-label={`Select ${p.name}`} className="h-3.5 w-3.5 accent-brand-500" />
                    </label>
                  </div>
                  <div className="p-2 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{p.name}</h3><p className="mt-0.5 font-mono text-[11px] text-slate-400">{p.sku} · {p.category}</p></div>
                      <Badge tone={p.status === 'active' ? 'green' : p.status === 'draft' ? 'amber' : 'slate'}>{p.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{fmtMoney(p.price)}</span>
                      {stockBadge(p)}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]">
                      <motion.div className={cx('h-full rounded-full', stockState(p) === 'out' ? 'bg-rose-500' : stockState(p) === 'low' ? 'bg-amber-500' : 'bg-emerald-500')} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (p.stock / Math.max(p.reorderLevel * 4, 1)) * 100)}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className={cx(btnGhost, 'flex-1 !py-2 text-[13px]')} onClick={() => setDetail(p)}><Eye size={14} /> View</button>
                      <button className={cx(btnGhost, 'flex-1 !py-2 text-[13px]')} onClick={() => nav(`/app/products/new?edit=${p.id}`)}><Pencil size={14} /> Edit</button>
                      <button className={cx(btnGhost, '!px-3 !py-2 text-rose-500')} onClick={() => setConfirmDel([p.id])} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </Card>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead><tr>
                <th className={thCls}><input type="checkbox" aria-label="Select all on page" checked={pageRows.every(p => selected.includes(p.id)) && pageRows.length > 0} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...pageRows.map(p => p.id)])] : selected.filter(id => !pageRows.some(p => p.id === id)))} className="accent-brand-500" /></th>
                <th className={thCls}><button className="inline-flex items-center gap-1 hover:text-brand-500" onClick={() => toggleSort('name')}>Product <ArrowUpDown size={11} /></button></th>
                <th className={thCls}>Category</th>
                <th className={thCls}><button className="inline-flex items-center gap-1 hover:text-brand-500" onClick={() => toggleSort('price')}>Price <ArrowUpDown size={11} /></button></th>
                <th className={thCls}>Cost</th>
                <th className={thCls}><button className="inline-flex items-center gap-1 hover:text-brand-500" onClick={() => toggleSort('stock')}>Stock <ArrowUpDown size={11} /></button></th>
                <th className={thCls}>Status</th><th className={thCls}>Actions</th>
              </tr></thead>
              <tbody>
                {pageRows.map(p => (
                  <tr key={p.id} className={rowCls}>
                    <td className={tdCls}><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSel(p.id)} aria-label={`Select ${p.name}`} className="accent-brand-500" /></td>
                    <td className={tdCls}><span className="flex items-center gap-3"><ProductVisual product={p} size="sm" /><span><span className="block font-medium text-slate-900 dark:text-white">{p.name}</span><span className="font-mono text-[11px] text-slate-400">{p.sku}</span></span></span></td>
                    <td className={tdCls}>{p.category}</td>
                    <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{fmtMoney(p.price)}</td>
                    <td className={tdCls}>{fmtMoney(p.cost)}</td>
                    <td className={tdCls}>{stockBadge(p)}</td>
                    <td className={tdCls}><Badge tone={p.status === 'active' ? 'green' : p.status === 'draft' ? 'amber' : 'slate'}>{p.status}</Badge></td>
                    <td className={tdCls}><span className="flex gap-1">
                      <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10" onClick={() => setDetail(p)} aria-label={`View ${p.name}`}><Eye size={15} /></button>
                      <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10" onClick={() => nav(`/app/products/new?edit=${p.id}`)} aria-label={`Edit ${p.name}`}><Pencil size={15} /></button>
                      <button className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" onClick={() => setConfirmDel([p.id])} aria-label={`Delete ${p.name}`}><Trash2 size={15} /></button>
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, safePage * PAGE_SIZE)} of {filtered.length} products</p>
          <div className="flex items-center gap-1.5">
            <button className={btnGhost + ' !px-3 !py-2'} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} aria-label={`Page ${n}`} aria-current={n === safePage ? 'page' : undefined} className={cx('h-9 w-9 rounded-lg text-sm font-medium transition', n === safePage ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/[0.07]')}>{n}</button>
            ))}
            <button className={btnGhost + ' !px-3 !py-2'} disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Product Details" wide>
        {detail && (
          <div className="grid gap-6 sm:grid-cols-2">
            <ProductVisual product={detail} size="lg" />
            <div>
              <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-bold text-slate-900 dark:text-white">{detail.name}</h3><Badge tone={detail.status === 'active' ? 'green' : detail.status === 'draft' ? 'amber' : 'slate'}>{detail.status}</Badge></div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{detail.description}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[['SKU', detail.sku], ['Category', detail.category], ['Selling price', fmtMoney(detail.price)], ['Cost price', fmtMoney(detail.cost)],
                  ['Margin', `${(((detail.price - detail.cost) / detail.price) * 100).toFixed(1)}%`], ['In stock', String(detail.stock)], ['Reserved', String(detail.reserved)],
                  ['Available', String(Math.max(0, detail.stock - detail.reserved))], ['Reorder level', String(detail.reorderLevel)],
                  ['Supplier', suppliers.find(s => s.id === detail.supplierId)?.name ?? '—'], ['Created', fmtDate(detail.createdAt)]].map(([k, v]) => (
                  <div key={k}><dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-6 flex gap-2">
                <button className={btnPrimary} onClick={() => nav(`/app/products/new?edit=${detail.id}`)}><Pencil size={15} /> Edit product</button>
                <button className={btnGhost} onClick={() => nav('/app/inventory')}>Manage stock</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={!!confirmDel} title="Delete product(s)?" body={`This will permanently remove ${confirmDel?.length ?? 0} product(s) from your catalog. Historical orders keep their item snapshots, so reports stay consistent. This cannot be undone.`}
        onCancel={() => setConfirmDel(null)} onConfirm={() => { deleteProducts(confirmDel ?? []); toast('Product(s) deleted.'); setSelected([]); setConfirmDel(null); setDetail(null) }} />
    </div>
  )
}

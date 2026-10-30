import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CATEGORIES } from '../../data/seed'
import { fmtMoney, uid } from '../../lib/utils'
import { Card, PageHead, ProductVisual, btnGhost, btnPrimary, cx, inputCls, labelCls } from '../../components/ui'
import type { Product, ProductStatus } from '../../types'

export default function ProductForm() {
  const { products, suppliers, upsertProduct, toast } = useStore()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const editing = useMemo(() => products.find(p => p.id === params.get('edit')), [products, params])

  const [form, setForm] = useState(() => ({
    name: editing?.name ?? '', sku: editing?.sku ?? '', description: editing?.description ?? '',
    category: editing?.category ?? 'Electronics', price: editing ? String(editing.price) : '', cost: editing ? String(editing.cost) : '',
    stock: editing ? String(editing.stock) : '0', reserved: editing ? String(editing.reserved) : '0',
    reorderLevel: editing ? String(editing.reorderLevel) : '10', supplierId: editing?.supplierId ?? suppliers[0]?.id ?? '',
    status: (editing?.status ?? 'active') as ProductStatus,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const preview: Product = {
    id: editing?.id ?? 'preview', name: form.name || 'Your product name', sku: form.sku || 'SKU-0000',
    description: form.description, category: form.category, price: Number(form.price) || 0, cost: Number(form.cost) || 0,
    stock: Number(form.stock) || 0, reserved: Number(form.reserved) || 0, reorderLevel: Number(form.reorderLevel) || 0,
    supplierId: form.supplierId, status: form.status, createdAt: editing?.createdAt ?? new Date().toISOString(),
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 3) errs.name = 'Name must be at least 3 characters.'
    if (form.sku.trim().length < 3) errs.sku = 'SKU is required (min. 3 characters).'
    if (products.some(p => p.sku.toLowerCase() === form.sku.trim().toLowerCase() && p.id !== editing?.id)) errs.sku = 'This SKU already exists in your catalog.'
    const price = Number(form.price), cost = Number(form.cost), stock = Number(form.stock), reserved = Number(form.reserved), reorder = Number(form.reorderLevel)
    if (!Number.isFinite(price) || price <= 0) errs.price = 'Enter a valid price above 0.'
    if (!Number.isFinite(cost) || cost < 0) errs.cost = 'Cost cannot be negative.'
    if (Number.isFinite(price) && Number.isFinite(cost) && cost > price) errs.cost = 'Cost is higher than the selling price — you would sell at a loss.'
    if (!Number.isInteger(stock) || stock < 0) errs.stock = 'Stock must be a whole number ≥ 0.'
    if (!Number.isInteger(reserved) || reserved < 0 || reserved > stock) errs.reserved = 'Reserved must be between 0 and total stock.'
    if (!Number.isInteger(reorder) || reorder < 0) errs.reorderLevel = 'Reorder level must be ≥ 0.'
    if (form.description.trim().length < 10) errs.description = 'Add a short description (min. 10 characters).'
    setErrors(errs)
    if (Object.keys(errs).length) { toast('Please fix the highlighted fields.', 'error'); return }

    upsertProduct({ ...preview, id: editing?.id ?? uid('prd'), name: form.name.trim(), sku: form.sku.trim().toUpperCase(), description: form.description.trim(), price, cost, stock, reserved, reorderLevel: reorder })
    toast(editing ? `"${form.name.trim()}" updated successfully.` : `"${form.name.trim()}" added to your catalog.`)
    nav('/app/products')
  }

  const Field = ({ label, k, ...props }: { label: string; k: keyof typeof form } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={k} className={labelCls}>{label}</label>
      <input id={k} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} className={cx(inputCls, errors[k] && '!border-rose-500 focus:!ring-rose-500/25')} {...props} />
      {errors[k] && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors[k]}</p>}
    </div>
  )

  return (
    <div>
      <Link to="/app/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-500"><ArrowLeft size={15} /> Back to products</Link>
      <PageHead title={editing ? 'Edit Product' : 'Create Product'} sub={editing ? `Editing ${editing.sku} — changes save instantly across the platform.` : 'Add a new product to your catalog. It will appear across inventory, analytics and reports.'} />
      <form onSubmit={submit} noValidate className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-5 p-6 xl:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Product name *" k="name" placeholder="e.g. Aurora Wireless Headphones" />
            <Field label="SKU *" k="sku" placeholder="e.g. ELC-1024" />
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>Description *</label>
            <textarea id="description" rows={3} value={form.description} onChange={set('description')} placeholder="Describe materials, key features and who it is for…" className={cx(inputCls, 'resize-none', errors.description && '!border-rose-500')} aria-invalid={!!errors.description} />
            {errors.description && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.description}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className={labelCls}>Category</label>
              <select id="category" value={form.category} onChange={set('category')} className={inputCls}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <label htmlFor="supplier" className={labelCls}>Supplier</label>
              <select id="supplier" value={form.supplierId} onChange={set('supplierId')} className={inputCls}>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            <div>
              <label htmlFor="status" className={labelCls}>Status</label>
              <select id="status" value={form.status} onChange={set('status')} className={inputCls}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Selling price (USD) *" k="price" type="number" step="0.01" min="0" placeholder="0.00" />
            <Field label="Cost price (USD) *" k="cost" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Stock quantity *" k="stock" type="number" step="1" min="0" />
            <Field label="Reserved units" k="reserved" type="number" step="1" min="0" />
            <Field label="Reorder level" k="reorderLevel" type="number" step="1" min="0" />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-white/[0.06]">
            <button type="submit" className={btnPrimary}><Save size={16} /> {editing ? 'Save changes' : 'Create product'}</button>
            <Link to="/app/products" className={btnGhost}>Cancel</Link>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Live preview</p>
            <ProductVisual product={preview} />
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">{preview.name}</p>
            <p className="text-xs text-slate-400">{preview.category} · Visual generated locally per category — no external images, never broken.</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Pricing insight</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Unit margin</dt><dd className="font-semibold text-slate-800 dark:text-slate-100">{preview.price > 0 ? `${(((preview.price - preview.cost) / preview.price) * 100).toFixed(1)}%` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Profit per unit</dt><dd className="font-semibold text-slate-800 dark:text-slate-100">{fmtMoney(Math.max(0, preview.price - preview.cost))}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Stock value (at cost)</dt><dd className="font-semibold text-slate-800 dark:text-slate-100">{fmtMoney(preview.stock * preview.cost)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Potential revenue</dt><dd className="font-semibold text-slate-800 dark:text-slate-100">{fmtMoney(preview.stock * preview.price)}</dd></div>
            </dl>
          </Card>
        </div>
      </form>
    </div>
  )
}

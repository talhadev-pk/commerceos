import { useState } from 'react'
import { Store, Palette, Bell, Database, Sun, Moon, RotateCcw, Download, Keyboard } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { downloadCSV } from '../../lib/utils'
import { Card, Confirm, PageHead, SectionTitle, btnDanger, btnGhost, btnPrimary, cx, inputCls, labelCls } from '../../components/ui'

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p><p className="mt-0.5 text-[13px] text-slate-400">{desc}</p></div>
      <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={cx('relative h-6.5 w-12 shrink-0 rounded-full p-0.5 transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600')} style={{ height: 26 }}>
        <span className={cx('block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform', checked && 'translate-x-[22px]')} />
      </button>
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings, theme, setTheme, resetDemoData, products, orders, customers, toast } = useStore()
  const [form, setForm] = useState(settings)
  const [confirmReset, setConfirmReset] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = () => {
    if (form.storeName.trim().length < 2) { toast('Store name is too short.', 'error'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail.trim())) { toast('Enter a valid support email.', 'error'); return }
    updateSettings({ ...form, taxRate: Math.min(40, Math.max(0, Number(form.taxRate) || 0)) })
    toast('Settings saved. Preferences persist in your browser.')
  }

  const exportAll = () => {
    downloadCSV('commerceos-full-export.csv', ['Type', 'ID / Name', 'Detail', 'Value'], [
      ...products.map(p => ['Product', `${p.sku} — ${p.name}`, p.category, p.price] as (string | number)[]),
      ...orders.map(o => ['Order', o.id, o.status, o.total] as (string | number)[]),
      ...customers.map(c => ['Customer', c.name, c.email, c.segment] as (string | number)[]),
    ])
    toast('Full workspace export downloaded.')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead title="Settings" sub="Store preferences, appearance, notifications and demonstration data controls." />

      <div className="space-y-4">
        <Card className="p-6">
          <SectionTitle title="Store Profile" sub="Shown in the sidebar, breadcrumbs and printed order summaries" action={<Store size={18} className="text-slate-400" />} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="storeName" className={labelCls}>Store name</label><input id="storeName" value={form.storeName} onChange={set('storeName')} className={inputCls} /></div>
            <div><label htmlFor="supportEmail" className={labelCls}>Support email</label><input id="supportEmail" type="email" value={form.supportEmail} onChange={set('supportEmail')} className={inputCls} /></div>
            <div><label htmlFor="currency" className={labelCls}>Display currency</label>
              <select id="currency" value={form.currency} onChange={set('currency')} className={inputCls}><option>USD</option><option>GBP</option><option>EUR</option><option>PKR</option></select>
              <p className="mt-1 text-xs text-slate-400">Demo amounts are stored in USD; this label is a display preference.</p></div>
            <div><label htmlFor="taxRate" className={labelCls}>Default tax rate (%)</label><input id="taxRate" type="number" min="0" max="40" step="0.5" value={form.taxRate} onChange={set('taxRate')} className={inputCls} /></div>
          </div>
          <button className={cx(btnPrimary, 'mt-5')} onClick={save}>Save changes</button>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Appearance" sub="Your theme preference is saved automatically" action={<Palette size={18} className="text-slate-400" />} />
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
            {([['dark', 'Dark', Moon, 'Deep graphite surfaces — the CommerceOS signature look'], ['light', 'Light', Sun, 'Clean neutral surfaces for bright environments']] as const).map(([v, l, Icon, d]) => (
              <button key={v} role="radio" aria-checked={theme === v} onClick={() => setTheme(v)}
                className={cx('rounded-2xl border p-4 text-left transition', theme === v ? 'border-brand-500 bg-brand-500/[0.07]' : 'border-slate-200 hover:border-slate-300 dark:border-white/10')}>
                <Icon size={20} className={theme === v ? 'text-brand-500' : 'text-slate-400'} />
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{l} theme</p>
                <p className="mt-0.5 text-xs text-slate-400">{d}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Notifications" sub="Control in-app demonstration alerts" action={<Bell size={18} className="text-slate-400" />} />
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            <Toggle checked={settings.lowStockAlerts} onChange={v => { updateSettings({ lowStockAlerts: v }); toast(v ? 'Low-stock alerts enabled.' : 'Low-stock alerts muted.', 'info') }} label="Low-stock alerts" desc="Notify when products fall to or below their reorder level." />
            <Toggle checked={settings.weeklyDigest} onChange={v => { updateSettings({ weeklyDigest: v }); toast(v ? 'Weekly digest enabled (demo).' : 'Weekly digest disabled.', 'info') }} label="Weekly analytics digest" desc="A simulated weekly performance summary notification." />
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Keyboard Shortcuts" action={<Keyboard size={18} className="text-slate-400" />} />
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex justify-between"><span>Global search</span><kbd className="rounded-md border border-slate-200 px-2 py-0.5 font-mono text-xs dark:border-white/15">Ctrl / ⌘ + K</kbd></li>
            <li className="flex justify-between"><span>Close dialog or search</span><kbd className="rounded-md border border-slate-200 px-2 py-0.5 font-mono text-xs dark:border-white/15">Esc</kbd></li>
            <li className="flex justify-between"><span>Move through controls</span><kbd className="rounded-md border border-slate-200 px-2 py-0.5 font-mono text-xs dark:border-white/15">Tab / Shift + Tab</kbd></li>
          </ul>
        </Card>

        <Card className="border-rose-500/25 p-6">
          <SectionTitle title="Demonstration Data" sub="All data lives only in your browser's local storage — no server, no account, nothing is uploaded." action={<Database size={18} className="text-rose-400" />} />
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['Products', products.length], ['Orders', orders.length], ['Customers', customers.length]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3.5 dark:bg-white/[0.04]"><p className="text-lg font-bold text-slate-900 dark:text-white">{v}</p><p className="text-[11px] uppercase tracking-wide text-slate-400">{k}</p></div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className={btnGhost} onClick={exportAll}><Download size={15} /> Export all data (CSV)</button>
            <button className={btnDanger} onClick={() => setConfirmReset(true)}><RotateCcw size={15} /> Restore demonstration data</button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">Restoring replaces every product, order, customer, supplier and notification with the original seeded dataset. Export first if you want to keep your changes.</p>
        </Card>
      </div>

      <Confirm open={confirmReset} title="Restore demonstration data?" confirmLabel="Restore data"
        body="All of your edits — products, stock adjustments, order statuses, customers and suppliers — will be replaced with the original CommerceOS sample dataset."
        onCancel={() => setConfirmReset(false)} onConfirm={() => { resetDemoData(); setForm(useStore.getState().settings); setConfirmReset(false) }} />
    </div>
  )
}

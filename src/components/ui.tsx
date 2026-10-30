import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingDown, TrendingUp, AlertTriangle, Package, Cpu, Home, Shirt, Briefcase, Sparkles, ShoppingBag, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Product } from '../types'
import { fmtMoney } from '../lib/utils'

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgb(15_23_42/0.05)] dark:border-white/[0.07] dark:bg-ink-900 dark:shadow-none', className)}>{children}</div>
}

export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>{sub && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{sub}</p>}</div>
      {action}
    </div>
  )
}

const badgeTones: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-400',
  red: 'bg-rose-500/10 text-rose-600 ring-rose-500/25 dark:text-rose-400',
  blue: 'bg-sky-500/10 text-sky-600 ring-sky-500/25 dark:text-sky-400',
  indigo: 'bg-brand-500/10 text-brand-600 ring-brand-500/25 dark:text-brand-300',
  slate: 'bg-slate-500/10 text-slate-600 ring-slate-500/25 dark:text-slate-300',
  teal: 'bg-teal-500/10 text-teal-600 ring-teal-500/25 dark:text-teal-400',
}
export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset', badgeTones[tone])}>{children}</span>
}

export const orderTone = (s: string): keyof typeof badgeTones =>
  s === 'delivered' ? 'green' : s === 'shipped' ? 'blue' : s === 'processing' ? 'indigo' : s === 'confirmed' ? 'teal' : s === 'pending' ? 'amber' : 'red'
export const payTone = (s: string): keyof typeof badgeTones => (s === 'paid' ? 'green' : s === 'pending' ? 'amber' : s === 'refunded' ? 'slate' : 'red')

export const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50'
export const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]'
export const btnDanger = 'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-[0.98]'
export const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'
export const labelCls = 'mb-1.5 block text-[13px] font-medium text-slate-600 dark:text-slate-300'

export function StatCard({ label, value, delta, icon: Icon, hint }: { label: string; value: string; delta?: number; icon: LucideIcon; hint?: string }) {
  return (
    <Card className="group p-5 transition hover:border-brand-500/30">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className="rounded-lg bg-brand-500/10 p-2 text-brand-600 transition group-hover:scale-110 dark:text-brand-300"><Icon size={17} /></span>
      </div>
      <p className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-[12px]">
        {delta !== undefined && (
          <span className={cx('inline-flex items-center gap-1 font-semibold', delta >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
            {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(delta).toFixed(1)}%
          </span>
        )}
        <span className="text-slate-400">{hint ?? 'vs previous period'}</span>
      </div>
    </Card>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={title}>
          <button aria-label="Close dialog" className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cx('relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-ink-850 sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><X size={18} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Confirm({ open, title, body, onCancel, onConfirm, confirmLabel = 'Delete' }: { open: boolean; title: string; body: string; onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex gap-3">
        <span className="h-fit rounded-xl bg-rose-500/10 p-2.5 text-rose-500"><AlertTriangle size={20} /></span>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{body}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className={btnGhost} onClick={onCancel}>Cancel</button>
        <button className={btnDanger} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}

const CAT_VISUAL: Record<string, { icon: LucideIcon; from: string; to: string }> = {
  Electronics: { icon: Cpu, from: '#6366f1', to: '#312e81' },
  Computers: { icon: Cpu, from: '#0ea5e9', to: '#0c4a6e' },
  Accessories: { icon: ShoppingBag, from: '#14b8a6', to: '#134e4a' },
  'Home & Living': { icon: Home, from: '#f59e0b', to: '#78350f' },
  Fashion: { icon: Shirt, from: '#ec4899', to: '#831843' },
  'Office Supplies': { icon: Briefcase, from: '#8b5cf6', to: '#4c1d95' },
  Lifestyle: { icon: Sparkles, from: '#10b981', to: '#064e3b' },
}
/** Locally generated product visual — category-coded, never a broken external link, always matches its category. */
export function ProductVisual({ product, size = 'md' }: { product: Product; size?: 'sm' | 'md' | 'lg' }) {
  const v = CAT_VISUAL[product.category] ?? { icon: Package, from: '#64748b', to: '#1e293b' }
  const Icon = v.icon
  const dims = size === 'sm' ? 'h-10 w-10 rounded-lg' : size === 'lg' ? 'h-full w-full min-h-44 rounded-2xl' : 'h-36 w-full rounded-xl'
  const iconSize = size === 'sm' ? 17 : size === 'lg' ? 52 : 34
  return (
    <div className={cx('relative flex shrink-0 items-center justify-center overflow-hidden text-white/90', dims)} style={{ background: `linear-gradient(135deg, ${v.from}, ${v.to})` }} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full opacity-[0.14]" aria-hidden="true"><defs><pattern id={`g-${product.id}`} width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0v18" fill="none" stroke="white" strokeWidth="0.7" /></pattern></defs><rect width="100%" height="100%" fill={`url(#g-${product.id})`} /></svg>
      <Icon size={iconSize} strokeWidth={1.4} className="relative drop-shadow" />
      {size !== 'sm' && <span className="absolute bottom-2 left-2.5 font-mono text-[10px] font-medium tracking-wider text-white/70">{product.sku}</span>}
      {size !== 'sm' && <span className="absolute right-2.5 top-2.5 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold text-white">{fmtMoney(product.price)}</span>}
    </div>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const hues = [239, 199, 174, 262, 330, 24, 152]
  const h = hues[(name.charCodeAt(0) + name.length) % hues.length]
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${h} 70% 52%), hsl(${h} 72% 34%))` }} aria-hidden="true">{initials}</span>
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="rounded-2xl bg-slate-100 p-3.5 text-slate-400 dark:bg-white/[0.06]"><Package size={26} /></span>
      <p className="mt-4 font-semibold text-slate-800 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function DemoBanner() {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-[13px] text-amber-700 dark:text-amber-300" role="note">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <p><strong>Demonstration workspace.</strong> All figures are simulated sample data stored locally in your browser — not real transactions. Use Settings → Restore demo data to reset at any time.</p>
    </div>
  )
}

export function PageHead({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[30px]">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sub}</p>
      </div>
      {action}
    </div>
  )
}

export const thCls = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400'
export const tdCls = 'px-4 py-3.5 text-sm text-slate-700 dark:text-slate-200'
export const rowCls = 'border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-white/[0.05] dark:hover:bg-white/[0.03]'

import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Users, Truck, BarChart3, FileText, Wallet,
  Bell, Settings, Search, Menu, X, Sun, Moon, ChevronLeft, ChevronRight, Plus, CheckCircle2,
  AlertCircle, Info, LogOut, Store, Command,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { Avatar, cx } from './ui'
import { fmtMoney, timeAgo } from '../lib/utils'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/products', label: 'Products', icon: Package },
  { to: '/app/inventory', label: 'Inventory', icon: Boxes },
  { to: '/app/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/app/customers', label: 'Customers', icon: Users },
  { to: '/app/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/finance', label: 'Finance', icon: Wallet },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const CRUMBS: Record<string, string> = Object.fromEntries(NAV.map(n => [n.to, n.label]))

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25">
        <Store size={18} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">Commerce<span className="text-brand-500">OS</span></span>
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Business Platform</span>
        </span>
      )}
    </span>
  )
}

function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, orders, customers } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 60) } }, [open])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return null
    return {
      products: products.filter(p => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(needle)).slice(0, 5),
      orders: orders.filter(o => o.id.toLowerCase().includes(needle)).slice(0, 5),
      customers: customers.filter(c => `${c.name} ${c.email}`.toLowerCase().includes(needle)).slice(0, 5),
    }
  }, [q, products, orders, customers])

  const go = (to: string) => { nav(to); onClose() }
  const Row = ({ label, sub, to }: { label: string; sub: string; to: string }) => (
    <button onClick={() => go(to)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/[0.06]">
      <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span><span className="block truncate text-xs text-slate-400">{sub}</span></span>
      <ChevronRight size={15} className="shrink-0 text-slate-300" />
    </button>
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[10vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Global search">
          <button aria-label="Close search" className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: -14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-ink-850">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-white/[0.07]">
              <Search size={18} className="text-slate-400" />
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search products, orders, customers…" aria-label="Global search"
                className="w-full bg-transparent py-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white" />
              <kbd className="hidden items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-400 dark:border-white/10 sm:flex">ESC</kbd>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!results && (
                <div className="p-2">
                  <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quick actions</p>
                  <Row label="Add a new product" sub="Create a product in your catalog" to="/app/products/new" />
                  <Row label="View analytics" sub="Revenue, growth and product performance" to="/app/analytics" />
                  <Row label="Generate a report" sub="Export sales, inventory or finance reports as CSV" to="/app/reports" />
                  <Row label="Check low stock" sub="Inventory alerts and replenishment" to="/app/inventory" />
                </div>
              )}
              {results && (
                <>
                  {results.products.length > 0 && <><p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Products</p>{results.products.map(p => <Row key={p.id} label={p.name} sub={`${p.sku} · ${p.category} · ${fmtMoney(p.price)}`} to="/app/products" />)}</>}
                  {results.orders.length > 0 && <><p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Orders</p>{results.orders.map(o => <Row key={o.id} label={`Order ${o.id}`} sub={`${o.status} · ${fmtMoney(o.total)}`} to={`/app/orders/${o.id}`} />)}</>}
                  {results.customers.length > 0 && <><p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Customers</p>{results.customers.map(c => <Row key={c.id} label={c.name} sub={c.email} to={`/app/customers/${c.id}`} />)}</>}
                  {!results.products.length && !results.orders.length && !results.customers.length && <p className="px-3 py-8 text-center text-sm text-slate-400">No results for “{q}”. Try a product name, SKU, order ID (e.g. COS-1042) or customer name.</p>}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AppShell() {
  const { theme, setTheme, sidebarCollapsed, toggleSidebar, notifications, markNotificationRead, toasts, dismissToast, settings } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const location = useLocation()
  const nav = useNavigate()
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  useEffect(() => { setMobileOpen(false); setNotifOpen(false); setUserOpen(false) }, [location.pathname])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const crumbKey = '/' + location.pathname.split('/').slice(1, 3).join('/')
  const crumb = CRUMBS[location.pathname] ?? CRUMBS[crumbKey] ?? 'Workspace'

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <NavLink to="/" aria-label="CommerceOS home"><Logo compact={sidebarCollapsed && !onNavigate} /></NavLink>
        {onNavigate && <button onClick={onNavigate} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden"><X size={18} /></button>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Primary">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} title={item.label}
            className={({ isActive }) => cx('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-500/[0.14] dark:text-brand-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white')}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId="nav-pill" className="absolute left-0 h-5 w-[3px] rounded-full bg-brand-500" />}
              <item.icon size={18} className="shrink-0" />
              {!(sidebarCollapsed && !onNavigate) && <span className="flex-1 truncate">{item.label}</span>}
              {item.label === 'Notifications' && unread > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
            </>)}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 p-3">
        {!(sidebarCollapsed && !onNavigate) && (
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
            <p className="text-sm font-semibold">Grow with CommerceOS</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-100">Explore analytics & reports built from your live demo data.</p>
            <button onClick={() => { nav('/app/analytics'); onNavigate?.() }} className="mt-3 w-full rounded-lg bg-white/15 py-2 text-xs font-semibold transition hover:bg-white/25">Open Analytics</button>
          </div>
        )}
        <button onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05] lg:flex">
          {sidebarCollapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /> Collapse</>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className={cx('fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white transition-[width] duration-300 dark:border-white/[0.06] dark:bg-ink-900 lg:block', sidebarCollapsed ? 'w-[76px]' : 'w-[264px]')}>
        {sidebar()}
      </aside>
      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button aria-label="Close menu" className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl dark:bg-ink-900 lg:hidden" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              {sidebar(() => setMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cx('transition-[padding] duration-300', sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-100/85 backdrop-blur-md dark:border-white/[0.06] dark:bg-ink-950/85">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/10 lg:hidden"><Menu size={20} /></button>
            <nav aria-label="Breadcrumb" className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-slate-400 lg:flex">
              <span className="max-w-[180px] truncate">{settings.storeName}</span><ChevronRight size={14} /><span className="font-medium text-slate-700 dark:text-slate-200">{crumb}</span>
            </nav>
            <button onClick={() => setSearchOpen(true)} className="mx-auto flex w-full min-w-0 max-w-md items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-400 transition hover:border-brand-400/50 dark:border-white/[0.08] dark:bg-white/[0.04]" aria-label="Open global search">
              <Search size={16} className="shrink-0" /><span className="min-w-0 flex-1 truncate text-left">Search products, orders, customers…</span>
              <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium dark:border-white/10 sm:flex"><Command size={10} />K</kbd>
            </button>
            <button onClick={() => nav('/app/products/new')} className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 md:inline-flex"><Plus size={16} /> New Product</button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-brand-500 dark:border-white/[0.08] dark:bg-white/[0.04]">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="relative">
              <button onClick={() => { setNotifOpen(v => !v); setUserOpen(false) }} aria-label={`Notifications, ${unread} unread`} className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-brand-500 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <Bell size={17} />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.16 }}
                    className="absolute right-0 top-12 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-850">
                    <div className="flex items-center justify-between px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p><button className="text-xs font-medium text-brand-500 hover:underline" onClick={() => nav('/app/notifications')}>View all</button></div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 6).map(n => (
                        <button key={n.id} onClick={() => { markNotificationRead(n.id); if (n.link) nav(n.link) }} className="flex w-full gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-white/[0.05] dark:hover:bg-white/[0.04]">
                          <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-500')} />
                          <span><span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</span><span className="mt-0.5 line-clamp-2 block text-xs text-slate-400">{n.body}</span><span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.date)}</span></span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button onClick={() => { setUserOpen(v => !v); setNotifOpen(false) }} aria-label="User menu" className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-200/50 dark:hover:bg-white/[0.06]">
                <Avatar name="Talha Dev" size={34} />
                <span className="hidden whitespace-nowrap text-left leading-tight xl:block"><span className="block text-[13px] font-semibold text-slate-800 dark:text-white">Store Manager</span><span className="block text-[11px] text-slate-400">Demo account</span></span>
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-white/10 dark:bg-ink-850">
                    <div className="px-3 py-2.5"><p className="text-sm font-semibold text-slate-900 dark:text-white">Store Manager</p><p className="text-xs text-slate-400">manager@commerceos.example</p></div>
                    <button onClick={() => nav('/app/settings')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]"><Settings size={15} /> Store settings</button>
                    <button onClick={() => nav('/')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]"><LogOut size={15} /> Back to website</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-ink-850">
              {t.kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" /> : t.kind === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" /> : <Info size={18} className="mt-0.5 shrink-0 text-sky-500" />}
              <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
              <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={15} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

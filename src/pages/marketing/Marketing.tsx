import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, BarChart3, Boxes, Check, ChevronDown, LayoutDashboard, Menu, Moon, Package,
  Search, ShieldCheck, ShoppingCart, Sun, Truck, Users, Wallet, X, Zap, Globe2, Sparkles,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { computeMetrics, dailySeries, filterByPeriod, fmtMoney, fmtNum, productPerformance } from '../../lib/utils'
import { Logo } from '../../components/AppShell'
import { Badge, ProductVisual, cx, orderTone } from '../../components/ui'
import { RevenueArea } from '../../components/Charts'

const reveal = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } } }

function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 1400); setVal(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [inView, to])
  return <span ref={ref}>{prefix}{fmtNum(val)}{suffix}</span>
}

function DashboardPreview() {
  const { orders, products, customers } = useStore()
  const m = computeMetrics(filterByPeriod(orders, 30))
  const series = dailySeries(orders, 30)
  const top = productPerformance(filterByPeriod(orders, 30), products).slice(0, 3)
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl shadow-brand-900/40 text-left" aria-label="Live preview of the CommerceOS dashboard using demonstration data">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3.5">
        <span className="h-3 w-3 rounded-full bg-rose-500/80" /><span className="h-3 w-3 rounded-full bg-amber-500/80" /><span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-3 flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-slate-400"><Search size={12} /> commerceos.app/dashboard</span>
        <Badge tone="amber">Live demo data</Badge>
      </div>
      <div className="grid sm:grid-cols-[210px_1fr]">
        <div className="hidden border-r border-white/[0.07] p-4 sm:block">
          <Logo />
          <div className="mt-6 space-y-1">
            {[['Dashboard', LayoutDashboard, true], ['Products', Package, false], ['Inventory', Boxes, false], ['Orders', ShoppingCart, false], ['Customers', Users, false], ['Analytics', BarChart3, false]].map(([l, Icon, active]: any) => (
              <span key={l} className={cx('flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium', active ? 'bg-brand-500/15 text-brand-200' : 'text-slate-400')}><Icon size={15} />{l}</span>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            {[['Revenue (30d)', fmtMoney(m.revenue)], ['Orders', fmtNum(m.orders)], ['Avg. order', fmtMoney(m.aov)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/[0.04] p-3"><p className="text-[11px] text-slate-400">{k}</p><p className="mt-1 truncate text-[15px] font-bold text-white sm:text-lg">{v}</p></div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-white/[0.03] p-3"><RevenueArea data={series} height={150} showProfit /></div>
          <div className="mt-3 space-y-2">
            {top.map(({ product, revenue }) => (
              <div key={product.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <ProductVisual product={product} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-200">{product.name}</span>
                <span className="text-[13px] font-bold text-white">{fmtMoney(revenue)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Rendered from the same live dataset as the full app — {products.length} products · {orders.length} orders · {customers.length} customers.</p>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: LayoutDashboard, title: 'Executive Dashboard', body: 'Revenue, orders, AOV, inventory value and alerts — one command centre with period-over-period comparison.' },
  { icon: Package, title: 'Product Management', body: 'A complete catalog with search, filters, bulk actions, grid/table views and validated product forms.' },
  { icon: Boxes, title: 'Inventory Control', body: 'Stock health, reserved vs available, reorder thresholds, adjustments and a full movement audit trail.' },
  { icon: ShoppingCart, title: 'Order Management', body: 'Seven fulfilment states, payment tracking, printable summaries and a visual fulfilment timeline.' },
  { icon: Users, title: 'Customer CRM', body: 'Segments, lifetime spend, order history and notes for every customer relationship.' },
  { icon: Truck, title: 'Supplier Management', body: 'Lead times, supplied categories and live stock value per supplier, with full CRUD.' },
  { icon: BarChart3, title: 'Business Intelligence', body: 'Revenue and profit trends, category and channel mix, product rankings — all derived from real records.' },
  { icon: Wallet, title: 'Financial Overview', body: 'Transparent P&L lines that explain every calculation, from gross sales to estimated gross profit.' },
  { icon: Search, title: 'Global Search — ⌘K', body: 'Find any product, order or customer instantly, without leaving the keyboard.' },
]

const FAQS = [
  ['Is CommerceOS connected to a real store or payment provider?', 'No. This portfolio build runs entirely in your browser with clearly-labelled simulated data. No real transactions, payments or personal information are involved — which also means it is completely free to explore.'],
  ['Where is my data stored?', 'Locally in your browser (localStorage). Every edit — products, stock adjustments, order statuses, theme — persists across refreshes on this device, and nothing is ever uploaded anywhere.'],
  ['Can I reset everything back to the start?', 'Yes. Settings → Restore demonstration data brings back the original seeded dataset (36 products, 150 orders, 24 customers, 8 suppliers) in one click.'],
  ['Do the analytics charts use real application data?', 'Absolutely. Every chart, KPI and report is computed live from the same order/product/customer records you can edit in the app. Change an order status and the dashboard recalculates instantly.'],
  ['What is CommerceOS built with?', 'React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, React Router and Zustand — a modern, production-style frontend stack, deployed as a static site.'],
  ['Does it work on mobile and tablet?', 'Yes — fully responsive from 360px phones to widescreen desktops, with a mobile navigation drawer, touch-friendly controls and horizontally scrollable data tables.'],
]

export default function Marketing() {
  const { theme, setTheme, products, orders, customers } = useStore()
  const [menu, setMenu] = useState(false)
  const [yearly, setYearly] = useState(true)
  const [faq, setFaq] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 56])
  const previewOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.55])

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])

  const plans = [
    { name: 'Starter', monthly: 29, desc: 'For new stores finding their rhythm', features: ['Up to 500 products', 'Orders & inventory', 'Executive dashboard', '2 team seats', 'Email support'] },
    { name: 'Growth', monthly: 79, desc: 'For growing commerce teams', popular: true, features: ['Unlimited products', 'Advanced analytics & reports', 'Customer CRM & segments', 'Supplier management', '10 team seats', 'Priority support'] },
    { name: 'Enterprise', monthly: 199, desc: 'For multi-channel operations', features: ['Everything in Growth', 'Financial overview & exports', 'Unlimited team seats', 'Custom onboarding', 'Dedicated success manager', '99.9% uptime SLA'] },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-ink-950 dark:text-slate-200">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-md dark:border-white/[0.06] dark:bg-ink-950/85">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="ml-8 hidden items-center gap-7 text-sm font-medium text-slate-500 dark:text-slate-400 lg:flex" aria-label="Marketing">
            <a href="#features" className="transition hover:text-brand-500">Platform</a>
            <a href="#capabilities" className="transition hover:text-brand-500">Capabilities</a>
            <a href="#pricing" className="transition hover:text-brand-500">Pricing</a>
            <a href="#faq" className="transition hover:text-brand-500">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:text-brand-500 dark:border-white/10">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <Link to="/app" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-brand-500 dark:text-slate-300 sm:block">Sign in</Link>
            <Link to="/app" className="hidden items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 sm:inline-flex">Launch Live Demo <ArrowRight size={15} /></Link>
            <button onClick={() => setMenu(v => !v)} aria-label="Toggle menu" aria-expanded={menu} className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10 lg:hidden">{menu ? <X size={17} /> : <Menu size={17} />}</button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 px-4 py-3 dark:border-white/[0.06] lg:hidden" aria-label="Mobile">
              {[['Platform', '#features'], ['Capabilities', '#capabilities'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([l, h]) => (
                <a key={l} href={h} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/[0.05]">{l}</a>
              ))}
              <Link to="/app" className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white">Launch Live Demo <ArrowRight size={15} /></Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="bg-grid relative overflow-hidden pb-20 pt-[136px] sm:pt-[156px]">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/[0.16] blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <motion.div variants={reveal} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.08] px-3.5 py-1.5 text-[13px] font-semibold text-brand-600 dark:text-brand-300"><Sparkles size={14} /> Enterprise E-Commerce Management Platform</span>
            <h1 className="mx-auto mt-6 max-w-4xl text-[38px] font-extrabold leading-[1.06] tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Your entire commerce business. <span className="bg-gradient-to-r from-brand-500 via-indigo-400 to-accent-400 bg-clip-text text-transparent">One intelligent platform.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
              CommerceOS unifies products, inventory, orders, customers, suppliers and business intelligence in a single, beautifully engineered workspace — built for owners, store managers and operations teams.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/app" className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:-translate-y-0.5 hover:bg-brand-500">Explore the Live Demo <ArrowRight size={17} /></Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-7 py-3.5 text-[15px] font-semibold transition hover:border-brand-400 hover:text-brand-500 dark:border-white/15">See the platform</a>
            </div>
            <p className="mt-4 text-[13px] text-slate-400">No sign-up · Runs 100% in your browser · Clearly-labelled demonstration data</p>
          </motion.div>
          <motion.div style={{ y: previewY, opacity: previewOpacity }} initial={{ opacity: 0, y: 44 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease: 'easeOut' }} className="mx-auto mt-14 max-w-5xl">
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* Animated stats */}
      <section className="border-y border-slate-200/70 bg-slate-50/60 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 text-center sm:px-6 lg:grid-cols-4">
          {([[products.length, '', 'Products managed in the live demo'], [orders.length, '', 'Simulated orders driving every chart'], [customers.length, '', 'Customer profiles with full history'], [12, '', 'Fully functional application modules']] as const).map(([n, s, l]) => (
            <div key={l}><p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"><Counter to={n} suffix={s} /></p><p className="mx-auto mt-1.5 max-w-[220px] text-[13px] text-slate-400">{l}</p></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand-500">The Platform</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Everything a commerce operation needs</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Nine deeply-integrated modules sharing one consistent dataset — edit anything, anywhere, and every metric follows.</p>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article key={f.title} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} transition={{ delay: (i % 3) * 0.08 }}
              className="group rounded-3xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-500/35 hover:shadow-xl hover:shadow-brand-600/[0.07] dark:border-white/[0.07] dark:bg-ink-900">
              <span className="inline-flex rounded-2xl bg-brand-500/10 p-3 text-brand-600 transition group-hover:scale-110 dark:text-brand-300"><f.icon size={22} /></span>
              <h3 className="mt-4 text-[17px] font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Capabilities showcase */}
      <section id="capabilities" className="scroll-mt-24 bg-slate-50/70 py-20 dark:bg-white/[0.02] sm:py-24">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6">
          {[
            { tag: 'Inventory Intelligence', title: 'Never run dry. Never overstock.', body: 'Live stock health bars, reserved-vs-available tracking, configurable reorder levels and a complete movement audit trail. Adjust stock once — valuation, alerts and dashboard KPIs update everywhere, instantly.', points: ['Low-stock & out-of-stock alerts', 'Validated adjustments — stock can never go negative', 'Inventory valuation at cost and retail'], img: 'inventory' },
            { tag: 'Business Intelligence', title: 'Decisions backed by your own numbers.', body: 'Revenue and profit trends, category and channel mix, product rankings and honest period-over-period comparisons. Every number is derived from your actual records — filter by period or category and watch it all recalculate.', points: ['7 / 30 / 90-day reporting periods', 'Estimated profit with transparent math', 'One-click CSV exports for every report'], img: 'analytics' },
          ].map((s, idx) => (
            <div key={s.title} className={cx('grid items-center gap-10 lg:grid-cols-2')}>
              <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className={idx === 1 ? 'lg:order-2' : ''}>
                <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand-500">{s.tag}</p>
                <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
                <ul className="mt-5 space-y-2.5">
                  {s.points.map(p => <li key={p} className="flex items-start gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span className="mt-0.5 rounded-full bg-emerald-500/15 p-0.5 text-emerald-500"><Check size={13} /></span>{p}</li>)}
                </ul>
                <Link to={s.img === 'inventory' ? '/app/inventory' : '/app/analytics'} className="mt-6 inline-flex items-center gap-2 font-semibold text-brand-500 hover:underline">Try it in the live demo <ArrowRight size={15} /></Link>
              </motion.div>
              <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className={idx === 1 ? 'lg:order-1' : ''}>
                <Showcase kind={s.img} />
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand-500">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Simple pricing that scales with you</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Illustrative plans for this portfolio demonstration — the live demo is free and fully unlocked.</p>
          <div className="mt-6 inline-flex rounded-xl border border-slate-200 p-1 dark:border-white/10" role="group" aria-label="Billing period">
            {([['Monthly', false], ['Yearly — save 20%', true]] as const).map(([l, v]) => (
              <button key={l} onClick={() => setYearly(v)} aria-pressed={yearly === v} className={cx('rounded-lg px-4 py-2 text-sm font-semibold transition', yearly === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.article key={p.name} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={cx('relative flex flex-col rounded-3xl border p-7', p.popular ? 'border-brand-500/60 bg-gradient-to-b from-brand-500/[0.09] to-transparent shadow-2xl shadow-brand-600/10' : 'border-slate-200/80 dark:border-white/[0.08]')}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3.5 py-1 text-xs font-bold text-white">Most Popular</span>}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{p.desc}</p>
              <p className="mt-5"><span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">${yearly ? Math.round(p.monthly * 0.8) : p.monthly}</span><span className="text-sm text-slate-400"> / month{yearly ? ', billed yearly' : ''}</span></p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map(f => <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"><span className="mt-0.5 rounded-full bg-emerald-500/15 p-0.5 text-emerald-500"><Check size={12} /></span>{f}</li>)}
              </ul>
              <Link to="/app" className={cx('mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition', p.popular ? 'bg-brand-600 text-white hover:bg-brand-500' : 'border border-slate-300 hover:border-brand-400 hover:text-brand-500 dark:border-white/15')}>Start with the free demo</Link>
            </motion.article>
          ))}
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> No real payments in this demo</span>
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> Instant, no sign-up required</span>
          <span className="flex items-center gap-1.5"><Globe2 size={14} className="text-sky-500" /> Works on any modern device</span>
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-slate-50/70 py-20 dark:bg-white/[0.02] sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map(([q, a], i) => (
              <div key={q} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/[0.07] dark:bg-ink-900">
                <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-white">{q}</span>
                  <motion.span animate={{ rotate: faq === i ? 180 : 0 }} className="shrink-0 text-slate-400"><ChevronDown size={18} /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {faq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 px-6 py-16 text-center text-white sm:px-12">
          <div className="bg-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Run your whole store from one intelligent workspace.</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">Open the live CommerceOS demo — manage products, adjust stock, move orders and watch the analytics respond in real time.</p>
            <Link to="/app" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-semibold text-brand-700 shadow-xl transition hover:-translate-y-0.5">Launch CommerceOS <ArrowRight size={17} /></Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200/70 dark:border-white/[0.06]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">Your entire commerce business. One intelligent platform. A portfolio demonstration by Talha Dev — Project 02.</p>
          </div>
          {([['Platform', ['Dashboard', 'Products', 'Inventory', 'Orders']],
             ['Business', ['Customers', 'Suppliers', 'Analytics', 'Finance']],
             ['Resources', ['Reports', 'Notifications', 'Settings', 'Live Demo']]] as const).map(([h, links]) => (
            <nav key={h} aria-label={h}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{h}</p>
              <ul className="mt-3.5 space-y-2.5 text-sm text-slate-400">
                {links.map(l => <li key={l}><Link to={l === 'Live Demo' ? '/app' : `/app${l === 'Dashboard' ? '' : '/' + l.toLowerCase()}`} className="transition hover:text-brand-500">{l}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-slate-200/70 py-5 text-center text-[13px] text-slate-400 dark:border-white/[0.06]">
          © {new Date().getFullYear()} CommerceOS — Demonstration project. All business data shown is simulated and stored locally in your browser.
        </div>
      </footer>
    </div>
  )
}

function Showcase({ kind }: { kind: string }) {
  const { products, orders } = useStore()
  if (kind === 'inventory') {
    const rows = [...products].sort((a, b) => a.stock - b.stock).slice(0, 4)
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.05] dark:border-white/[0.08] dark:bg-ink-900">
        <p className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">Inventory Health <Badge tone="amber">Needs attention</Badge></p>
        <div className="space-y-3">
          {rows.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <ProductVisual product={p} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                  <motion.div className={cx('h-full rounded-full', p.stock === 0 ? 'bg-rose-500' : p.stock <= p.reorderLevel ? 'bg-amber-500' : 'bg-emerald-500')} initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, (p.stock / Math.max(p.reorderLevel * 4, 1)) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{p.stock} left</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const recent = orders.slice(0, 4)
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.05] dark:border-white/[0.08] dark:bg-ink-900">
      <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Revenue Trend — 90 days</p>
      <RevenueArea data={dailySeries(orders, 90)} height={170} showProfit />
      <div className="mt-3 space-y-2">
        {recent.map(o => (
          <div key={o.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
            <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{o.id}</span>
            <Badge tone={orderTone(o.status)}>{o.status}</Badge>
            <span className="ml-auto text-sm font-bold text-slate-900 dark:text-white">{fmtMoney(o.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

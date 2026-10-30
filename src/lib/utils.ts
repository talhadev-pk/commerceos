import type { Customer, Order, Product } from '../types'

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n)
export const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n)
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
export const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

/** Orders that count toward sales (excludes cancelled). Returned orders are tracked as refunds. */
export const salesOrders = (orders: Order[]) => orders.filter(o => o.status !== 'cancelled')

export function filterByPeriod<T extends { date: string }>(rows: T[], days: number): T[] {
  const cutoff = Date.now() - days * 86400000
  return rows.filter(r => new Date(r.date).getTime() >= cutoff)
}

/** Previous equivalent period, for honest period-over-period comparison. */
export function previousPeriod<T extends { date: string }>(rows: T[], days: number): T[] {
  const now = Date.now()
  return rows.filter(r => { const t = new Date(r.date).getTime(); return t < now - days * 86400000 && t >= now - days * 2 * 86400000 })
}

export interface Metrics {
  revenue: number; orders: number; aov: number; units: number
  grossSales: number; discounts: number; refunds: number; shippingRevenue: number
  productCosts: number; grossProfit: number; netSales: number; margin: number
}

export function computeMetrics(orders: Order[]): Metrics {
  const live = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
  const returned = orders.filter(o => o.status === 'returned')
  const grossSales = live.reduce((s, o) => s + o.subtotal, 0)
  const discounts = live.reduce((s, o) => s + o.discount, 0)
  const shippingRevenue = live.reduce((s, o) => s + o.shipping, 0)
  const refunds = returned.reduce((s, o) => s + o.total, 0)
  const productCosts = live.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty * i.unitCost, 0), 0)
  const revenue = live.reduce((s, o) => s + o.total, 0)
  const netSales = grossSales - discounts
  const grossProfit = netSales - productCosts
  return {
    revenue, orders: live.length, aov: live.length ? revenue / live.length : 0,
    units: live.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0),
    grossSales, discounts, refunds, shippingRevenue, productCosts, grossProfit, netSales,
    margin: netSales ? (grossProfit / netSales) * 100 : 0,
  }
}

export const pctChange = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / Math.abs(prev)) * 100)

/** Daily revenue/order series for charts — always derived from real order records. */
export function dailySeries(orders: Order[], days: number) {
  const map = new Map<string, { date: string; label: string; revenue: number; orders: number; profit: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, { date: key, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), revenue: 0, orders: 0, profit: 0 })
  }
  for (const o of salesOrders(orders)) {
    if (o.status === 'returned') continue
    const row = map.get(o.date.slice(0, 10))
    if (!row) continue
    row.revenue += o.total; row.orders += 1
    row.profit += o.items.reduce((a, i) => a + i.qty * (i.unitPrice - i.unitCost), 0)
  }
  // For 90-day views, bucket weekly to keep charts readable & fast
  const rows = [...map.values()]
  if (days > 45) {
    const weekly: typeof rows = []
    for (let i = 0; i < rows.length; i += 7) {
      const slice = rows.slice(i, i + 7)
      weekly.push({ date: slice[0].date, label: slice[0].label, revenue: sum(slice.map(r => r.revenue)), orders: sum(slice.map(r => r.orders)), profit: sum(slice.map(r => r.profit)) })
    }
    return weekly
  }
  return rows
}
const sum = (a: number[]) => Math.round(a.reduce((s, n) => s + n, 0) * 100) / 100

export interface ProductPerf { product: Product; units: number; revenue: number; profit: number }
export function productPerformance(orders: Order[], products: Product[]): ProductPerf[] {
  const map = new Map<string, ProductPerf>()
  for (const o of orders) {
    if (o.status === 'cancelled' || o.status === 'returned') continue
    for (const it of o.items) {
      const p = products.find(x => x.id === it.productId)
      if (!p) continue
      const cur = map.get(it.productId) ?? { product: p, units: 0, revenue: 0, profit: 0 }
      cur.units += it.qty; cur.revenue += it.qty * it.unitPrice; cur.profit += it.qty * (it.unitPrice - it.unitCost)
      map.set(it.productId, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export function categoryPerformance(orders: Order[], products: Product[]) {
  const map = new Map<string, { category: string; revenue: number; units: number; orders: number }>()
  for (const o of orders) {
    if (o.status === 'cancelled' || o.status === 'returned') continue
    const seen = new Set<string>()
    for (const it of o.items) {
      const p = products.find(x => x.id === it.productId); if (!p) continue
      const cur = map.get(p.category) ?? { category: p.category, revenue: 0, units: 0, orders: 0 }
      cur.revenue += it.qty * it.unitPrice; cur.units += it.qty
      if (!seen.has(p.category)) { cur.orders += 1; seen.add(p.category) }
      map.set(p.category, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export function customerStats(orders: Order[], customers: Customer[]) {
  return customers.map(c => {
    const mine = orders.filter(o => o.customerId === c.id && o.status !== 'cancelled' && o.status !== 'returned')
    const spend = mine.reduce((s, o) => s + o.total, 0)
    const last = mine.sort((a, b) => b.date.localeCompare(a.date))[0]?.date
    return { customer: c, orders: mine.length, spend, lastPurchase: last, aov: mine.length ? spend / mine.length : 0 }
  }).sort((a, b) => b.spend - a.spend)
}

/** Safe CSV export generated entirely from in-app data. Values are quoted/escaped — no HTML injection surface. */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export const stockState = (p: Product): 'out' | 'low' | 'healthy' => (p.stock === 0 ? 'out' : p.stock <= p.reorderLevel ? 'low' : 'healthy')

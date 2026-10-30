import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Activity, AppNotification, Customer, Order, OrderStatus, Product, StockMovement, StoreSettings, Supplier } from '../types'
import { buildSeed } from '../data/seed'
import { uid } from '../lib/utils'

export interface Toast { id: string; title: string; kind: 'success' | 'error' | 'info' }

interface State {
  products: Product[]; orders: Order[]; customers: Customer[]; suppliers: Supplier[]
  movements: StockMovement[]; notifications: AppNotification[]; activities: Activity[]
  theme: 'dark' | 'light'; sidebarCollapsed: boolean; settings: StoreSettings
  toasts: Toast[]
  // actions
  toast: (title: string, kind?: Toast['kind']) => void
  dismissToast: (id: string) => void
  setTheme: (t: 'dark' | 'light') => void
  toggleSidebar: () => void
  upsertProduct: (p: Product) => void
  deleteProducts: (ids: string[]) => void
  bulkSetProductStatus: (ids: string[], status: Product['status']) => void
  adjustStock: (productId: string, delta: number, reason: string) => boolean
  setReorderLevel: (productId: string, level: number) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  upsertCustomer: (c: Customer) => void
  deleteCustomer: (id: string) => void
  upsertSupplier: (s: Supplier) => void
  deleteSupplier: (id: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  updateSettings: (s: Partial<StoreSettings>) => void
  resetDemoData: () => void
}

const seed = buildSeed()
const log = (label: string, kind: string): Activity => ({ id: uid('act'), date: new Date().toISOString(), label, kind })

/** Storage wrapper that never throws — corrupt/blocked storage falls back to seed data. */
const safeStorage = {
  getItem: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* quota/blocked — app keeps working in-memory */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k) } catch { /* noop */ } },
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed,
      theme: 'dark', sidebarCollapsed: false, toasts: [],
      settings: { storeName: 'Northwind Retail Co.', currency: 'USD', supportEmail: 'support@northwind.example', lowStockAlerts: true, weeklyDigest: true, taxRate: 0 },

      toast: (title, kind = 'success') => {
        const id = uid('toast')
        set(s => ({ toasts: [...s.toasts, { id, title, kind }] }))
        setTimeout(() => get().dismissToast(id), 3600)
      },
      dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
      setTheme: theme => set({ theme }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      upsertProduct: p => set(s => {
        const exists = s.products.some(x => x.id === p.id)
        return {
          products: exists ? s.products.map(x => (x.id === p.id ? p : x)) : [p, ...s.products],
          activities: [log(`${exists ? 'Updated' : 'Created'} product "${p.name}"`, 'product'), ...s.activities].slice(0, 30),
        }
      }),
      deleteProducts: ids => set(s => ({
        products: s.products.filter(p => !ids.includes(p.id)),
        activities: [log(`Deleted ${ids.length} product(s)`, 'product'), ...s.activities].slice(0, 30),
      })),
      bulkSetProductStatus: (ids, status) => set(s => ({ products: s.products.map(p => (ids.includes(p.id) ? { ...p, status } : p)) })),

      adjustStock: (productId, delta, reason) => {
        const p = get().products.find(x => x.id === productId)
        if (!p || !Number.isFinite(delta) || delta === 0) return false
        if (p.stock + delta < 0) { get().toast('Adjustment rejected — stock cannot go below zero.', 'error'); return false }
        set(s => ({
          products: s.products.map(x => (x.id === productId ? { ...x, stock: x.stock + delta } : x)),
          movements: [{ id: uid('mov'), productId, date: new Date().toISOString(), type: delta > 0 ? 'in' : 'adjustment', qty: delta, reason: reason || 'Manual adjustment', reference: 'MANUAL' }, ...s.movements],
          activities: [log(`Stock ${delta > 0 ? '+' : ''}${delta} for "${p.name}"`, 'stock'), ...s.activities].slice(0, 30),
        }))
        return true
      },
      setReorderLevel: (productId, level) => set(s => ({ products: s.products.map(p => (p.id === productId ? { ...p, reorderLevel: Math.max(0, Math.floor(level) || 0) } : p)) })),

      updateOrderStatus: (orderId, status) => set(s => ({
        orders: s.orders.map(o => o.id === orderId
          ? { ...o, status, payment: status === 'cancelled' || status === 'returned' ? 'refunded' : o.payment === 'pending' && status !== 'pending' ? 'paid' : o.payment,
              history: [...o.history, { at: new Date().toISOString(), label: `Status changed to ${status}` }] }
          : o),
        activities: [log(`Order ${orderId} → ${status}`, 'order'), ...s.activities].slice(0, 30),
      })),

      upsertCustomer: c => set(s => ({ customers: s.customers.some(x => x.id === c.id) ? s.customers.map(x => (x.id === c.id ? c : x)) : [c, ...s.customers] })),
      deleteCustomer: id => set(s => ({ customers: s.customers.filter(c => c.id !== id) })),
      upsertSupplier: sup => set(s => ({ suppliers: s.suppliers.some(x => x.id === sup.id) ? s.suppliers.map(x => (x.id === sup.id ? sup : x)) : [sup, ...s.suppliers] })),
      deleteSupplier: id => set(s => ({ suppliers: s.suppliers.filter(x => x.id !== id) })),

      markNotificationRead: id => set(s => ({ notifications: s.notifications.map(n => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
      updateSettings: patch => set(s => ({ settings: { ...s.settings, ...patch } })),
      resetDemoData: () => { const fresh = buildSeed(); set({ ...fresh }); get().toast('Demonstration data restored to its original state.', 'info') },
    }),
    {
      name: 'commerceos-store-v1',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: s => ({
        products: s.products, orders: s.orders, customers: s.customers, suppliers: s.suppliers,
        movements: s.movements, notifications: s.notifications, activities: s.activities,
        theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, settings: s.settings,
      }),
      merge: (persisted, current) => {
        // Validate shape — never trust stored data blindly.
        const p = persisted as Partial<State> | null
        if (!p || !Array.isArray(p.products) || !Array.isArray(p.orders)) return current
        return { ...current, ...p, toasts: [] }
      },
    },
  ),
)

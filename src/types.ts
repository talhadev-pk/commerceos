export type ID = string

export type ProductStatus = 'active' | 'draft' | 'archived'
export interface Product {
  id: ID
  name: string
  sku: string
  description: string
  category: string
  price: number
  cost: number
  stock: number
  reserved: number
  reorderLevel: number
  supplierId: ID
  status: ProductStatus
  createdAt: string // ISO
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed'
export interface OrderItem { productId: ID; name: string; sku: string; qty: number; unitPrice: number; unitCost: number }
export interface Order {
  id: ID // e.g. COS-1042
  customerId: ID
  date: string // ISO
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: OrderStatus
  payment: PaymentStatus
  channel: 'Online Store' | 'Marketplace' | 'POS' | 'Wholesale'
  history: { at: string; label: string }[]
}

export type CustomerStatus = 'active' | 'inactive' | 'vip'
export interface Customer {
  id: ID
  name: string
  email: string
  phone: string
  city: string
  country: string
  status: CustomerStatus
  segment: 'New' | 'Returning' | 'Loyal' | 'At Risk'
  notes: string
  joinedAt: string
}

export interface Supplier {
  id: ID
  name: string
  contact: string
  email: string
  phone: string
  country: string
  categories: string[]
  status: 'active' | 'inactive'
  leadTimeDays: number
  notes: string
}

export interface StockMovement {
  id: ID
  productId: ID
  date: string
  type: 'in' | 'out' | 'adjustment' | 'return'
  qty: number // signed
  reason: string
  reference: string
}

export interface AppNotification {
  id: ID
  title: string
  body: string
  kind: 'stock' | 'order' | 'system' | 'customer'
  date: string
  read: boolean
  link?: string
}

export interface Activity { id: ID; date: string; label: string; kind: string }

export interface StoreSettings {
  storeName: string
  currency: string
  supportEmail: string
  lowStockAlerts: boolean
  weeklyDigest: boolean
  taxRate: number
}

export type Period = 7 | 30 | 90

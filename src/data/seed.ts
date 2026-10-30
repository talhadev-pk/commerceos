import type { Activity, AppNotification, Customer, Order, OrderStatus, Product, StockMovement, Supplier } from '../types'

/**
 * Deterministic demonstration dataset.
 * A seeded PRNG guarantees the same demo data on every fresh install,
 * and every metric in the app is derived from these records — nothing is hard-coded.
 */
function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry(20261030)
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
const money = (n: number) => Math.round(n * 100) / 100
const daysAgo = (d: number) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(int(8, 20), int(0, 59), 0, 0); return t.toISOString() }

export const CATEGORIES = ['Electronics', 'Computers', 'Accessories', 'Home & Living', 'Fashion', 'Office Supplies', 'Lifestyle'] as const

const SUPPLIER_ROWS: [string, string, string, string, string[], number][] = [
  ['NorthBridge Electronics Ltd', 'Amelia Hart', 'orders@northbridge.example', 'United Kingdom', ['Electronics', 'Computers'], 6],
  ['Vertex Supply Co', 'Daniel Osei', 'sales@vertexsupply.example', 'United States', ['Accessories', 'Computers'], 4],
  ['CasaLiving Imports', 'Sofia Marino', 'hello@casaliving.example', 'Italy', ['Home & Living', 'Lifestyle'], 11],
  ['Atlas Apparel Group', 'Yusuf Rahman', 'b2b@atlasapparel.example', 'Türkiye', ['Fashion'], 9],
  ['PrimeStation Office Ltd', 'Grace Liu', 'supply@primestation.example', 'Singapore', ['Office Supplies', 'Accessories'], 5],
  ['Nordwind Trading Oy', 'Elias Korhonen', 'export@nordwind.example', 'Finland', ['Lifestyle', 'Home & Living'], 8],
  ['TechNova Distribution', 'Priya Nair', 'partners@technova.example', 'India', ['Electronics', 'Accessories'], 7],
  ['BlueHarbor Logistics', 'Marcus Webb', 'trade@blueharbor.example', 'Netherlands', ['Computers', 'Electronics'], 5],
]

export function seedSuppliers(): Supplier[] {
  return SUPPLIER_ROWS.map(([name, contact, email, country, categories, lead], i) => ({
    id: `sup-${i + 1}`, name, contact, email, phone: `+1 555-01${10 + i}`, country, categories,
    status: i === 7 ? 'inactive' : 'active', leadTimeDays: lead,
    notes: i % 3 === 0 ? 'Preferred supplier — net-30 terms.' : i % 3 === 1 ? 'Quarterly pricing review scheduled.' : 'Standard terms.',
  }))
}

// [name, category, price, skuPrefix]
const PRODUCT_ROWS: [string, string, number, string][] = [
  ['Aurora Wireless Noise-Cancelling Headphones', 'Electronics', 189.99, 'ELC'],
  ['PulseFit Smart Watch Series 5', 'Electronics', 249.00, 'ELC'],
  ['VoltCore 65W GaN Fast Charger', 'Electronics', 49.99, 'ELC'],
  ['EchoSphere Portable Bluetooth Speaker', 'Electronics', 79.95, 'ELC'],
  ['ClearView 4K Action Camera', 'Electronics', 299.00, 'ELC'],
  ['StreamDeck Wireless Earbuds Pro', 'Electronics', 129.99, 'ELC'],
  ['AeroBook 14" Ultra-Slim Laptop', 'Computers', 1099.00, 'CMP'],
  ['ProStation Mechanical Keyboard RGB', 'Computers', 139.00, 'CMP'],
  ['Precision Wireless Mouse Ergo', 'Computers', 69.99, 'CMP'],
  ['UltraView 27" QHD Monitor', 'Computers', 379.50, 'CMP'],
  ['DataVault 1TB Portable SSD', 'Computers', 119.99, 'CMP'],
  ['ConnectHub 7-in-1 USB-C Dock', 'Computers', 89.00, 'CMP'],
  ['TravelSafe Laptop Backpack 20L', 'Accessories', 94.95, 'ACC'],
  ['MagSnap Phone Stand & Wallet', 'Accessories', 34.99, 'ACC'],
  ['Braided USB-C Cable 2m (2-Pack)', 'Accessories', 19.99, 'ACC'],
  ['Leather Card Holder Slim', 'Accessories', 45.00, 'ACC'],
  ['FlexGrip Tablet Case 11"', 'Accessories', 39.99, 'ACC'],
  ['Nomad Cable Organiser Pouch', 'Accessories', 24.50, 'ACC'],
  ['Lumina Ceramic Table Lamp', 'Home & Living', 119.00, 'HME'],
  ['Nordica Cotton Throw Blanket', 'Home & Living', 59.95, 'HME'],
  ['AromaPure Essential Oil Diffuser', 'Home & Living', 54.99, 'HME'],
  ['Terra Stoneware Dinner Set (16 pc)', 'Home & Living', 149.00, 'HME'],
  ['Breeze Linen Cushion Cover Set', 'Home & Living', 42.00, 'HME'],
  ['Heritage Wool Crew Sweater', 'Fashion', 89.99, 'FSH'],
  ['Metro Slim-Fit Chino Trousers', 'Fashion', 64.50, 'FSH'],
  ['Classic Leather Sneakers', 'Fashion', 119.95, 'FSH'],
  ['Essential Organic Cotton Tee (3-Pack)', 'Fashion', 39.99, 'FSH'],
  ['Urban Explorer Denim Jacket', 'Fashion', 99.00, 'FSH'],
  ['ErgoFlow Mesh Office Chair', 'Office Supplies', 279.00, 'OFC'],
  ['Precision Gel Pen Set (12)', 'Office Supplies', 16.99, 'OFC'],
  ['Dotted A5 Notebook — Hardcover', 'Office Supplies', 14.95, 'OFC'],
  ['Adjustable Aluminium Desk Stand', 'Office Supplies', 74.99, 'OFC'],
  ['HydraSteel Insulated Bottle 750ml', 'Lifestyle', 29.99, 'LST'],
  ['TrailBlaze Insulated Travel Mug', 'Lifestyle', 24.95, 'LST'],
  ['ZenFlow Yoga Mat Pro 6mm', 'Lifestyle', 49.99, 'LST'],
  ['Summit Daypack 25L Waterproof', 'Lifestyle', 79.00, 'LST'],
]

const DESCRIPTIONS: Record<string, string> = {
  Electronics: 'Premium consumer electronics with extended warranty and retail-ready packaging.',
  Computers: 'Performance computing hardware for professionals and creators.',
  Accessories: 'Everyday carry accessory engineered for durability and daily use.',
  'Home & Living': 'Thoughtfully crafted homeware made from quality, sustainable materials.',
  Fashion: 'Contemporary apparel with a tailored fit and breathable natural fibres.',
  'Office Supplies': 'Workspace essential designed for comfort, focus and productivity.',
  Lifestyle: 'Adventure-ready lifestyle gear built for comfort on the move.',
}

export function seedProducts(suppliers: Supplier[]): Product[] {
  return PRODUCT_ROWS.map(([name, category, price, prefix], i) => {
    const matched = suppliers.filter(s => s.categories.includes(category))
    const supplier = matched.length ? matched[i % matched.length] : suppliers[0]
    const stock = i % 11 === 4 ? int(0, 3) : i % 7 === 3 ? int(4, 9) : int(18, 240)
    return {
      id: `prd-${i + 1}`, name, sku: `${prefix}-${1000 + i * 7}`, category,
      description: DESCRIPTIONS[category],
      price, cost: money(price * (0.52 + rnd() * 0.18)),
      stock, reserved: Math.min(stock, int(0, 6)), reorderLevel: [10, 15, 20][i % 3],
      supplierId: supplier.id, status: i % 13 === 6 ? 'draft' : 'active',
      createdAt: daysAgo(int(20, 320)),
    }
  })
}

const FIRST = ['Ayesha', 'Liam', 'Noah', 'Emma', 'Oliver', 'Sophia', 'Lucas', 'Mia', 'Ethan', 'Isabella', 'James', 'Amara', 'Ben', 'Zara', 'Henry', 'Layla', 'Omar', 'Freya', 'Leo', 'Inaya', 'Hugo', 'Nora', 'Adam', 'Elena']
const LAST = ['Khan', 'Smith', 'Patel', 'Brown', 'Ahmed', 'Wilson', 'Chen', 'Garcia', 'Ali', 'Taylor', 'Novak', 'Haddad', 'Kim', 'Rossi', 'Iqbal', 'Meyer', 'Costa', 'Sharma', 'Novikova', 'Fischer', 'Haugen', 'Silva', 'Malik', 'Dubois']
const CITIES: [string, string][] = [['London', 'United Kingdom'], ['New York', 'United States'], ['Dubai', 'UAE'], ['Toronto', 'Canada'], ['Berlin', 'Germany'], ['Sydney', 'Australia'], ['Amsterdam', 'Netherlands'], ['Singapore', 'Singapore']]

export function seedCustomers(): Customer[] {
  return FIRST.map((f, i) => {
    const [city, country] = CITIES[i % CITIES.length]
    const name = `${f} ${LAST[i]}`
    return {
      id: `cus-${i + 1}`, name, email: `${f.toLowerCase()}.${LAST[i].toLowerCase()}@example.com`,
      phone: `+44 7700 900${100 + i}`, city, country,
      status: i % 9 === 0 ? 'vip' : i % 8 === 5 ? 'inactive' : 'active',
      segment: (['New', 'Returning', 'Loyal', 'Returning', 'At Risk'] as const)[i % 5],
      notes: i % 6 === 0 ? 'Prefers email communication. Wholesale enquiries in the past.' : '',
      joinedAt: daysAgo(int(15, 700)),
    }
  })
}

const STATUS_BY_AGE = (ageDays: number): OrderStatus => {
  const r = rnd()
  if (ageDays <= 1) return r < 0.45 ? 'pending' : r < 0.8 ? 'confirmed' : 'processing'
  if (ageDays <= 4) return r < 0.15 ? 'processing' : r < 0.55 ? 'shipped' : r < 0.9 ? 'delivered' : 'confirmed'
  if (r < 0.82) return 'delivered'
  if (r < 0.88) return 'cancelled'
  if (r < 0.93) return 'returned'
  return 'shipped'
}

export function seedOrders(products: Product[], customers: Customer[]): Order[] {
  const orders: Order[] = []
  const sellable = products.filter(p => p.status !== 'draft')
  for (let i = 0; i < 150; i++) {
    const age = Math.floor(Math.pow(rnd(), 1.35) * 90) // denser near today → believable growth
    const date = daysAgo(age)
    const customer = pick(customers)
    const itemCount = int(1, 4)
    const chosen = new Map<string, number>()
    for (let j = 0; j < itemCount; j++) { const p = pick(sellable); chosen.set(p.id, (chosen.get(p.id) ?? 0) + int(1, 3)) }
    const items = [...chosen.entries()].map(([pid, qty]) => {
      const p = products.find(x => x.id === pid)!
      return { productId: pid, name: p.name, sku: p.sku, qty, unitPrice: p.price, unitCost: p.cost }
    })
    const subtotal = money(items.reduce((s, it) => s + it.qty * it.unitPrice, 0))
    const discount = rnd() < 0.22 ? money(subtotal * 0.1) : 0
    const shipping = subtotal - discount >= 150 ? 0 : pick([6.99, 9.99, 12.99])
    const status = STATUS_BY_AGE(age)
    const payment = status === 'cancelled' ? (rnd() < 0.5 ? 'refunded' : 'failed') : status === 'returned' ? 'refunded' : status === 'pending' ? 'pending' : 'paid'
    orders.push({
      id: `COS-${1001 + i}`, customerId: customer.id, date, items, subtotal, discount, shipping,
      total: money(subtotal - discount + shipping), status, payment: payment as Order['payment'],
      channel: pick(['Online Store', 'Online Store', 'Marketplace', 'POS', 'Wholesale'] as const),
      history: [
        { at: date, label: 'Order placed' },
        ...(age > 0 && status !== 'pending' ? [{ at: date, label: `Status moved to ${status}` }] : []),
      ],
    })
  }
  return orders.sort((a, b) => b.date.localeCompare(a.date))
}

export function seedMovements(products: Product[]): StockMovement[] {
  const reasons: [StockMovement['type'], string][] = [
    ['in', 'Supplier delivery received'], ['in', 'Purchase order fulfilled'], ['out', 'Order fulfilment'],
    ['adjustment', 'Cycle count correction'], ['return', 'Customer return restocked'], ['out', 'Damaged units written off'],
  ]
  return Array.from({ length: 36 }, (_, i) => {
    const p = pick(products); const [type, reason] = reasons[i % reasons.length]
    const qty = type === 'in' || type === 'return' ? int(5, 60) : -int(1, 25)
    return { id: `mov-${i + 1}`, productId: p.id, date: daysAgo(int(0, 45)), type, qty, reason, reference: type === 'in' ? `PO-${2400 + i}` : `COS-${1001 + int(0, 120)}` }
  }).sort((a, b) => b.date.localeCompare(a.date))
}

export function seedNotifications(products: Product[]): AppNotification[] {
  const low = products.filter(p => p.stock <= p.reorderLevel).slice(0, 4)
  const list: AppNotification[] = low.map((p, i) => ({
    id: `ntf-stock-${i}`, kind: 'stock', title: p.stock === 0 ? 'Out of stock' : 'Low stock warning',
    body: `${p.name} has ${p.stock} units remaining (reorder level ${p.reorderLevel}).`,
    date: daysAgo(int(0, 2)), read: i > 1, link: '/app/inventory',
  }))
  list.push(
    { id: 'ntf-1', kind: 'order', title: 'New orders received', body: 'Several new demonstration orders were added to the pipeline today.', date: daysAgo(0), read: false, link: '/app/orders' },
    { id: 'ntf-2', kind: 'system', title: 'Weekly analytics digest ready', body: 'Your business performance summary for the last 7 days is available.', date: daysAgo(1), read: false, link: '/app/analytics' },
    { id: 'ntf-3', kind: 'customer', title: 'VIP customer milestone', body: 'A loyal customer crossed a lifetime-spend milestone this week.', date: daysAgo(2), read: true, link: '/app/customers' },
    { id: 'ntf-4', kind: 'system', title: 'Demonstration workspace', body: 'All data in CommerceOS is simulated sample data stored locally in your browser.', date: daysAgo(3), read: true },
  )
  return list.sort((a, b) => b.date.localeCompare(a.date))
}

export function seedActivities(orders: Order[], customers: Customer[]): Activity[] {
  const acts: Activity[] = orders.slice(0, 6).map((o, i) => ({
    id: `act-o-${i}`, date: o.date, kind: 'order',
    label: `Order ${o.id} (${o.status}) — ${customers.find(c => c.id === o.customerId)?.name ?? 'Customer'}`,
  }))
  acts.push({ id: 'act-s-1', date: daysAgo(1), kind: 'stock', label: 'Stock replenishment received from NorthBridge Electronics Ltd' })
  acts.push({ id: 'act-c-1', date: daysAgo(2), kind: 'customer', label: 'New customer segment "Loyal" updated automatically' })
  return acts.sort((a, b) => b.date.localeCompare(a.date))
}

export interface SeedData { products: Product[]; suppliers: Supplier[]; customers: Customer[]; orders: Order[]; movements: StockMovement[]; notifications: AppNotification[]; activities: Activity[] }

export function buildSeed(): SeedData {
  const suppliers = seedSuppliers()
  const products = seedProducts(suppliers)
  const customers = seedCustomers()
  const orders = seedOrders(products, customers)
  return { products, suppliers, customers, orders, movements: seedMovements(products), notifications: seedNotifications(products), activities: seedActivities(orders, customers) }
}

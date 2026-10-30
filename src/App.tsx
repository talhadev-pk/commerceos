import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useStore } from './store/useStore'

// Route-level code splitting keeps the initial bundle lean.
const Marketing = lazy(() => import('./pages/marketing/Marketing'))
const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Products = lazy(() => import('./pages/app/Products'))
const ProductForm = lazy(() => import('./pages/app/ProductForm'))
const Inventory = lazy(() => import('./pages/app/Inventory'))
const Orders = lazy(() => import('./pages/app/Orders'))
const OrderDetail = lazy(() => import('./pages/app/OrderDetail'))
const Customers = lazy(() => import('./pages/app/Customers'))
const CustomerDetail = lazy(() => import('./pages/app/CustomerDetail'))
const Suppliers = lazy(() => import('./pages/app/Suppliers'))
const Analytics = lazy(() => import('./pages/app/Analytics'))
const Finance = lazy(() => import('./pages/app/Finance'))
const Reports = lazy(() => import('./pages/app/Reports'))
const Notifications = lazy(() => import('./pages/app/Notifications'))
const Settings = lazy(() => import('./pages/app/Settings'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [pathname])
  return null
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6" role="status" aria-label="Loading page">
      <div className="skeleton h-9 w-64 rounded-xl bg-slate-200 dark:bg-white/[0.07]" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full rounded-lg bg-slate-200 dark:bg-white/[0.07]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl bg-slate-200 dark:bg-white/[0.07]" style={{ animationDelay: `${i * 0.12}s` }} />)}
      </div>
      <div className="skeleton mt-4 h-80 rounded-2xl bg-slate-200 dark:bg-white/[0.07]" />
    </div>
  )
}

export default function App() {
  const theme = useStore(s => s.theme)
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])

  return (
    <HashRouter>
      <ScrollToTop />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Marketing />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="finance" element={<Finance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

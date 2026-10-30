import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Boxes, ShoppingCart, Settings2, Users, CheckCheck } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { timeAgo, fmtDate } from '../../lib/utils'
import { Badge, Card, Empty, PageHead, btnPrimary, cx } from '../../components/ui'

const KIND = {
  stock: { icon: Boxes, tone: 'amber' as const },
  order: { icon: ShoppingCart, tone: 'blue' as const },
  system: { icon: Settings2, tone: 'slate' as const },
  customer: { icon: Users, tone: 'indigo' as const },
}

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const nav = useNavigate()
  const unread = notifications.filter(n => !n.read).length
  const rows = filter === 'all' ? notifications : notifications.filter(n => !n.read)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead title="Notifications" sub={`${unread} unread · Stock alerts are generated from your live inventory levels.`}
        action={<button className={btnPrimary} onClick={markAllNotificationsRead} disabled={unread === 0}><CheckCheck size={15} /> Mark all read</button>} />

      <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04] w-fit" role="group" aria-label="Notification filter">
        {([['all', `All (${notifications.length})`], ['unread', `Unread (${unread})`]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} aria-pressed={filter === v} className={cx('rounded-lg px-4 py-1.5 text-[13px] font-medium transition', filter === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>{l}</button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty title="You're all caught up" body="No notifications match this filter. New stock and order alerts will appear here." />
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {rows.map(n => {
                const k = KIND[n.kind]
                return (
                  <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button onClick={() => { markNotificationRead(n.id); if (n.link) nav(n.link) }}
                      className={cx('flex w-full items-start gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-0 hover:bg-slate-50 dark:border-white/[0.05] dark:hover:bg-white/[0.03]', !n.read && 'bg-brand-500/[0.04]')}>
                      <span className="rounded-xl bg-slate-100 p-2.5 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"><k.icon size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</span>
                          <Badge tone={k.tone}>{n.kind}</Badge>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">{n.body}</span>
                        <span className="mt-1.5 block text-xs text-slate-400">{timeAgo(n.date)} · {fmtDate(n.date)}</span>
                      </span>
                      <Bell size={15} className="mt-1 shrink-0 text-slate-300 dark:text-slate-600" />
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </div>
  )
}

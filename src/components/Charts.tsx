import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { fmtMoney, fmtNum } from '../lib/utils'

export const CHART_COLORS = ['#6366f1', '#14b8a6', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981']

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-white/10 dark:bg-ink-800">
      {label && <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-200">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="capitalize">{p.name}:</span>
          <strong>{money ? fmtMoney(Number(p.value)) : fmtNum(Number(p.value))}</strong>
        </p>
      ))}
    </div>
  )
}

export function RevenueArea({ data, height = 300, showProfit }: { data: any[]; height?: number; showProfit?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.32} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} /></linearGradient>
          <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity={0.28} /><stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="#64748b" strokeOpacity={0.14} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
        <Tooltip content={<ChartTooltip money />} />
        {showProfit && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.4} fill="url(#rev)" animationDuration={700} />
        {showProfit && <Area type="monotone" dataKey="profit" name="Est. profit" stroke="#14b8a6" strokeWidth={2} fill="url(#prof)" animationDuration={700} />}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function OrdersBar({ data, height = 260 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="#64748b" strokeOpacity={0.14} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#6366f1', opacity: 0.07 }} />
        <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={26} animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryDonut({ data, height = 260 }: { data: { category: string; revenue: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="revenue" nameKey="category" innerRadius="58%" outerRadius="82%" paddingAngle={2.5} strokeWidth={0} animationDuration={700}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip content={<ChartTooltip money />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11.5 }} formatter={(v: string) => <span className="text-slate-500 dark:text-slate-300">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function TrendLines({ data, height = 260, keys }: { data: any[]; height?: number; keys: { key: string; name: string; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="#64748b" strokeOpacity={0.14} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}`} />
        <Tooltip content={<ChartTooltip money />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {keys.map(k => <Line key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color} strokeWidth={2.2} dot={false} animationDuration={700} />)}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function HBar({ data, height = 280 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="#64748b" strokeOpacity={0.14} horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={128} tick={{ fontSize: 11 }} />
        <Tooltip content={<ChartTooltip money />} cursor={{ fill: '#6366f1', opacity: 0.07 }} />
        <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={18} animationDuration={700}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

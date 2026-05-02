import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatAmount } from '../utils/calculations'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function MonthlyLineChart({ series, unit }) {
  const data = Array.from({ length: 12 }, (_, i) => {
    const point = { month: `${i + 1}월` }
    for (const s of series) {
      point[s.name] = s.data[i + 1] ?? null
    }
    return point
  })

  const formatTick = (val) => {
    if (val === null || val === undefined) return ''
    let divisor = 1
    if (unit === '천') divisor = 1000
    else if (unit === '만') divisor = 10000
    return Math.round(val / divisor).toLocaleString()
  }

  const formatTooltip = (val, name) => {
    if (val === null || val === undefined) return ['-', name]
    return [formatAmount(val, unit) + (unit !== '원' ? unit : '원'), name]
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatTick} tick={{ fontSize: 11 }} width={70} />
        <Tooltip formatter={formatTooltip} />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

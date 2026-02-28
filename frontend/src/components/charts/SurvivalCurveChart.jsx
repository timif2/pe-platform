import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

const COLORS = [
  '#1a56db',
  '#0f4c81',
  '#3b82f6',
  '#6366f1',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">t = {label} years</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-mono font-medium">{(p.value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function SurvivalCurveChart({ data, groups, height = 280, showMedianLine = true }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-xs text-gray-400">No survival data available</div>
  }

  const groupKeys = groups || Object.keys(data[0]).filter(k => k !== 'time' && k !== 't')

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#6c757d' }}
          tickLine={false}
          axisLine={{ stroke: '#dee2e6' }}
          label={{ value: 'Time (years)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#adb5bd' }}
        />
        <YAxis
          domain={[0, 1]}
          tick={{ fontSize: 10, fill: '#6c757d' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          width={44}
          label={{ value: 'Survival Prob.', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#adb5bd' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconSize={10}
          iconType="line"
        />
        {showMedianLine && (
          <ReferenceLine
            y={0.5}
            stroke="#adb5bd"
            strokeDasharray="4 4"
            label={{ value: 'Median', position: 'right', fontSize: 9, fill: '#adb5bd' }}
          />
        )}
        {groupKeys.map((key, i) => (
          <Line
            key={key}
            type="stepAfter"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            name={key}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

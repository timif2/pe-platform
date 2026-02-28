import React from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label, yFormat }) => {
  if (!active || !payload || !payload.length) return null
  const format = yFormat || ((v) => v)
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">Year {label}</div>
      {payload.map((p, i) => {
        if (!p.name || p.name.includes('Range')) {
          return null
        }
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="font-medium text-gray-600">{p.name}:</span>
            <span className="font-mono">{format(p.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function FanChart({
  data,
  xKey = 'year',
  yLabel = 'Value',
  yFormat,
  height = 220,
  title
}) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-40 text-xs text-gray-400">No data available</div>
  )

  const fmt = yFormat || ((v) => v !== undefined ? v.toFixed(2) : '')

  return (
    <div>
      {title && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: '#6c757d' }}
            tickLine={false}
            axisLine={{ stroke: '#dee2e6' }}
            label={{ value: 'Year', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#adb5bd' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6c757d' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmt}
            width={48}
          />
          <Tooltip content={<CustomTooltip yFormat={fmt} />} />

          {/* P10-P25 band */}
          <Area
            dataKey="p10_25_range"
            stroke="none"
            fill="#bfdbfe"
            fillOpacity={0.5}
            name="P10-P25 Range"
          />
          {/* P25-P75 band (main) */}
          <Area
            dataKey="p25_75_range"
            stroke="none"
            fill="#93c5fd"
            fillOpacity={0.4}
            name="P25-P75 Range"
          />
          {/* P75-P90 band */}
          <Area
            dataKey="p75_90_range"
            stroke="none"
            fill="#bfdbfe"
            fillOpacity={0.5}
            name="P75-P90 Range"
          />

          {/* Boundary lines */}
          <Line
            dataKey="p10"
            stroke="#93c5fd"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 2"
            name="P10"
          />
          <Line
            dataKey="p25"
            stroke="#3b82f6"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 2"
            name="P25"
          />
          <Line
            dataKey="p50"
            stroke="#1a56db"
            strokeWidth={2}
            dot={false}
            name="P50 (Median)"
          />
          <Line
            dataKey="p75"
            stroke="#3b82f6"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 2"
            name="P75"
          />
          <Line
            dataKey="p90"
            stroke="#93c5fd"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 2"
            name="P90"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

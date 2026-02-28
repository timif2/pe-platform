import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  const val = payload[0].value
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">SHAP Impact:</span>
        <span className={`font-mono font-medium ${val >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(3)}
        </span>
      </div>
      <div className="text-gray-400 mt-1">
        {val >= 0 ? 'Increases' : 'Decreases'} predicted MOIC
      </div>
    </div>
  )
}

export default function SHAPChart({ data, height = 280, title }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-xs text-gray-400">No SHAP data available</div>
  }

  const sorted = [...data].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))

  return (
    <div>
      {title && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 130, bottom: 4 }}
          barSize={14}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#6c757d' }}
            tickLine={false}
            axisLine={{ stroke: '#dee2e6' }}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 10, fill: '#495057' }}
            tickLine={false}
            axisLine={false}
            width={125}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#adb5bd" strokeWidth={1} />
          <Bar dataKey="shap_value" radius={[0, 2, 2, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.shap_value >= 0 ? '#1a56db' : '#ef4444'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

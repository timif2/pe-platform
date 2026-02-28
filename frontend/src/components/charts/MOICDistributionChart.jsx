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
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700">{label}x MOIC</div>
      <div className="text-gray-600">Frequency: <span className="font-mono font-medium">{payload[0].value}</span></div>
    </div>
  )
}

export default function MOICDistributionChart({
  data,
  p10,
  p50,
  p90,
  height = 200,
  highlightMoic
}) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-xs text-gray-400">No distribution data</div>
  }

  return (
    <div>
      {(p10 !== undefined || p50 !== undefined || p90 !== undefined) && (
        <div className="flex gap-4 mb-3">
          {p10 !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">P10</div>
              <div className="font-mono text-xs font-semibold text-gray-700">{p10.toFixed(1)}x</div>
            </div>
          )}
          {p50 !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">P50</div>
              <div className="font-mono text-sm font-bold text-brand-500">{p50.toFixed(1)}x</div>
            </div>
          )}
          {p90 !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">P90</div>
              <div className="font-mono text-xs font-semibold text-gray-700">{p90.toFixed(1)}x</div>
            </div>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
          <XAxis
            dataKey="moic"
            tick={{ fontSize: 10, fill: '#6c757d' }}
            tickLine={false}
            axisLine={{ stroke: '#dee2e6' }}
            tickFormatter={(v) => `${v}x`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6c757d' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />

          {p10 !== undefined && (
            <ReferenceLine
              x={p10}
              stroke="#6c757d"
              strokeDasharray="3 3"
              label={{ value: 'P10', position: 'top', fontSize: 9, fill: '#6c757d' }}
            />
          )}
          {p50 !== undefined && (
            <ReferenceLine
              x={p50}
              stroke="#1a56db"
              strokeWidth={1.5}
              label={{ value: 'P50', position: 'top', fontSize: 9, fill: '#1a56db' }}
            />
          )}
          {p90 !== undefined && (
            <ReferenceLine
              x={p90}
              stroke="#6c757d"
              strokeDasharray="3 3"
              label={{ value: 'P90', position: 'top', fontSize: 9, fill: '#6c757d' }}
            />
          )}

          <Bar dataKey="frequency" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => {
              const isHighlighted = highlightMoic !== undefined && Math.abs(entry.moic - highlightMoic) < 0.26
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isHighlighted ? '#1a56db' : '#93c5fd'}
                  opacity={isHighlighted ? 1 : 0.8}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

import React from 'react'
import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function formatValue(value, format) {
  if (value === null || value === undefined) return '-'
  switch (format) {
    case 'currency': {
      const abs = Math.abs(value)
      if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
      if (abs >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
      if (abs >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
      return `$${value.toFixed(0)}`
    }
    case 'percent':
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    case 'multiple':
      return `${value.toFixed(1)}x`
    case 'number':
    default:
      if (typeof value === 'number') return value.toLocaleString()
      return String(value)
  }
}

export default function KPICard({ label, value, delta, deltaLabel, format = 'number', trend, className }) {
  const formattedValue = formatValue(value, format)

  let trendColor = 'text-gray-500'
  let TrendIcon = Minus
  if (trend === 'up' || (typeof delta === 'number' && delta > 0)) {
    trendColor = 'text-emerald-600'
    TrendIcon = TrendingUp
  } else if (trend === 'down' || (typeof delta === 'number' && delta < 0)) {
    trendColor = 'text-red-600'
    TrendIcon = TrendingDown
  }

  return (
    <div className={clsx('panel px-4 py-3', className)}>
      <div className="metric-label mb-1">{label}</div>
      <div className="metric-value">{formattedValue}</div>
      {(delta !== undefined || deltaLabel) && (
        <div className={clsx('flex items-center gap-1 mt-1', trendColor)}>
          <TrendIcon size={11} />
          <span className="text-xs font-medium">
            {delta !== undefined && typeof delta === 'number'
              ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
              : ''}
            {deltaLabel && <span className="ml-1 text-gray-400 font-normal">{deltaLabel}</span>}
          </span>
        </div>
      )}
    </div>
  )
}

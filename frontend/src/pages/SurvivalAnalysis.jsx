import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { TrendingDown, Info } from 'lucide-react'
import clsx from 'clsx'
import { analyticsApi } from '../api'
import { MOCK_SURVIVAL } from '../data/mockData'
import SurvivalCurveChart from '../components/charts/SurvivalCurveChart'

const GROUP_OPTIONS = [
  { value: 'sector', label: 'Sector' },
  { value: 'fund', label: 'Fund' },
  { value: 'geography', label: 'Geography' },
]

const TIME_RANGES = ['3Y', '5Y', '10Y']

const HEATMAP_COLORS = [
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
]

function getHeatmapColor(value) {
  const idx = Math.min(Math.floor(value * 9), 8)
  return HEATMAP_COLORS[idx]
}

function getTextColor(value) {
  return value > 0.6 ? '#fff' : '#1e3a8a'
}

function HeatmapGrid({ data, vintages }) {
  if (!data || data.length === 0) return <div className="text-xs text-gray-400 p-4">No data</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-gray-500 font-semibold uppercase tracking-wider py-2 px-3 bg-gray-50 border border-gray-200 w-32">Sector</th>
            {vintages.map(v => (
              <th key={v} className="text-center text-gray-500 font-semibold uppercase tracking-wider py-2 px-3 bg-gray-50 border border-gray-200">
                {v}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium text-gray-700 border border-gray-200 bg-gray-50">
                {row.sector}
              </td>
              {vintages.map(v => {
                const val = row[v]
                const bg = val !== undefined ? getHeatmapColor(val) : '#f8f9fa'
                const color = val !== undefined ? getTextColor(val) : '#adb5bd'
                return (
                  <td
                    key={v}
                    className="text-center py-2 px-3 border border-gray-200 font-mono font-semibold"
                    style={{ backgroundColor: bg, color }}
                  >
                    {val !== undefined ? `${(val * 100).toFixed(0)}%` : '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-2 ml-2">
        <span className="text-xs text-gray-400">Survival Rate:</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-xs text-gray-400">Low &rarr; High</span>
      </div>
    </div>
  )
}

export default function SurvivalAnalysis() {
  const [groupBy, setGroupBy] = useState('sector')
  const [timeRange, setTimeRange] = useState('10Y')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    analyticsApi.getSurvival(groupBy)
      .then(res => setData(res.data))
      .catch(() => setData(MOCK_SURVIVAL[groupBy] || MOCK_SURVIVAL.sector))
      .finally(() => setLoading(false))
  }, [groupBy])

  const survival = data || MOCK_SURVIVAL.sector
  const maxTime = timeRange === '3Y' ? 3 : timeRange === '5Y' ? 5 : 10
  const filteredCurves = (survival.curves || []).filter(d => d.time <= maxTime)

  const vintages = ['2014', '2016', '2018', '2020', '2022']

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Group By:</span>
            <div className="flex gap-1">
              {GROUP_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGroupBy(opt.value)}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium rounded border transition-colors',
                    groupBy === opt.value
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-brand-500 hover:text-brand-500'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Time Range:</span>
          <div className="flex gap-1">
            {TIME_RANGES.map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded border transition-colors',
                  timeRange === t
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-500'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Banner */}
      {survival.insights && (
        <div className="panel p-4 bg-blue-50/30 border-brand-100">
          <div className="flex items-start gap-3">
            <Info size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
            <div className="grid grid-cols-4 gap-6 flex-1">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Median Time to Exit</div>
                <div className="font-mono text-sm font-bold text-gray-900">{survival.insights.median_time_to_exit} years</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">5-Year Exit Probability</div>
                <div className="font-mono text-sm font-bold text-gray-900">{survival.insights.five_year_exit_probability}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Highest Exit Rate</div>
                <div className="text-sm font-bold text-amber-600">{survival.insights.highest_risk}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lowest Exit Rate</div>
                <div className="text-sm font-bold text-emerald-600">{survival.insights.lowest_risk}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Survival Chart */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Kaplan-Meier Survival Curves</span>
          <span className="text-xs text-gray-400">Grouped by {GROUP_OPTIONS.find(o => o.value === groupBy)?.label}</span>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="h-72 bg-gray-100 rounded animate-pulse" />
          ) : (
            <SurvivalCurveChart
              data={filteredCurves}
              groups={survival.groups}
              height={300}
            />
          )}
        </div>
      </div>

      {/* Hazard Rate & Heatmap Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Hazard Rate by Sector</span>
            <span className="text-xs text-gray-400">Annual conditional exit probability</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 bg-gray-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[...(survival.hazard_rates || [])].sort((a, b) => b.hazard - a.hazard)}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 100, bottom: 4 }}
                  barSize={16}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#6c757d' }}
                    tickLine={false}
                    axisLine={{ stroke: '#dee2e6' }}
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    tick={{ fontSize: 10, fill: '#495057' }}
                    tickLine={false}
                    axisLine={false}
                    width={95}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
                          <div className="font-semibold text-gray-700">{label}</div>
                          <div>Hazard Rate: <span className="font-mono font-medium">{(payload[0].value * 100).toFixed(1)}%</span></div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="hazard" radius={[0, 2, 2, 0]}>
                    {(survival.hazard_rates || []).sort((a, b) => b.hazard - a.hazard).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#1a56db'}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Exit Probability Heatmap</span>
            <span className="text-xs text-gray-400">Sector x Vintage Year (cumulative)</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 bg-gray-100 rounded animate-pulse" />
            ) : (
              <HeatmapGrid data={survival.heatmap || []} vintages={vintages} />
            )}
          </div>
        </div>
      </div>

      {/* Vintage Comparison Table */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Vintage Cohort Analysis</span>
          <span className="text-xs text-gray-400">Exit performance by vintage year</span>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="h-40 animate-pulse bg-gray-50" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vintage</th>
                  <th className="text-right">Cohort Size</th>
                  <th className="text-right">Exited</th>
                  <th className="text-right">Still Active</th>
                  <th className="text-right">Median Hold (yrs)</th>
                  <th className="text-right">Avg MOIC</th>
                  <th className="text-right">5-Yr Exit Rate</th>
                </tr>
              </thead>
              <tbody>
                {(survival.vintage_table || []).map(row => (
                  <tr key={row.vintage}>
                    <td className="font-mono font-semibold">{row.vintage}</td>
                    <td className="text-right font-mono">{row.cohort_size}</td>
                    <td className="text-right font-mono text-emerald-600">{row.exited}</td>
                    <td className="text-right font-mono text-brand-500">{row.active}</td>
                    <td className="text-right font-mono">{row.median_hold}</td>
                    <td className={clsx('text-right font-mono font-semibold', row.avg_moic >= 2 ? 'text-brand-500' : 'text-gray-700')}>
                      {row.avg_moic}x
                    </td>
                    <td className="text-right font-mono font-medium">{row.five_yr_exit_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import KPICard from '../components/common/KPICard'
import { KPICardSkeleton, ChartSkeleton } from '../components/common/LoadingState'
import FanChart from '../components/charts/FanChart'
import { analyticsApi } from '../api'
import { MOCK_OVERVIEW } from '../data/mockData'

function formatCurrency(v) {
  if (v === undefined || v === null) return '-'
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v}`
}

const NavTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-0.5 inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-mono font-medium">${p.value}M</span>
        </div>
      ))}
    </div>
  )
}

const ExitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-mono font-medium">{p.dataKey === 'proceeds' ? `$${p.value}M` : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    analyticsApi.getOverview()
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(() => { if (!cancelled) setData(MOCK_OVERVIEW) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const d = data || MOCK_OVERVIEW

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <KPICard
              label="Portfolio NAV"
              value={d.portfolio_nav}
              format="currency"
              delta={12.4}
              deltaLabel="vs. prior quarter"
              trend="up"
            />
            <KPICard
              label="Expected DPI"
              value={d.expected_dpi}
              format="multiple"
              delta={0.1}
              deltaLabel="vs. entry case"
              trend="up"
            />
            <KPICard
              label="Expected TVPI"
              value={d.expected_tvpi}
              format="multiple"
              delta={0.2}
              deltaLabel="vs. entry case"
              trend="up"
            />
            <KPICard
              label="Active Companies"
              value={d.active_companies}
              format="number"
            />
            <KPICard
              label="Exits Next 24M"
              value={d.exits_next_24m}
              format="number"
              deltaLabel="est. FY24-25"
            />
            <KPICard
              label="Liquidity Forecast"
              value={d.liquidity_forecast}
              format="currency"
              deltaLabel="next 18 months"
              trend="up"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* NAV Evolution */}
        <div className="panel col-span-1">
          <div className="panel-header">
            <span className="panel-title">NAV Evolution</span>
            <span className="text-xs text-gray-400">$M</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={d.nav_evolution ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={false} width={44} tickFormatter={v => `$${v}M`} />
                  <Tooltip content={<NavTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
                  <Line type="monotone" dataKey="committed" stroke="#adb5bd" strokeWidth={1.5} dot={false} name="Committed" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="nav" stroke="#1a56db" strokeWidth={2} dot={{ r: 3, fill: '#1a56db' }} name="NAV" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cash Flow Fan */}
        <div className="panel col-span-1">
          <div className="panel-header">
            <span className="panel-title">Cash Flow Projection</span>
            <span className="text-xs text-gray-400">Monte Carlo Fan (P10-P90) $M</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            ) : (
              <FanChart
                data={d.cash_flow_fan ?? []}
                xKey="year"
                yFormat={(v) => `$${v}M`}
                height={200}
              />
            )}
          </div>
        </div>

        {/* Exit Timing */}
        <div className="panel col-span-1">
          <div className="panel-header">
            <span className="panel-title">Exit Timing Forecast</span>
            <span className="text-xs text-gray-400">Projected exits per year</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.exit_timing ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={<ExitTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
                  <Bar dataKey="exits" fill="#1a56db" name="# Exits" radius={[2, 2, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fund Performance Table */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Fund Performance Summary</span>
            <span className="text-xs text-gray-400">As of Q4 2023</span>
          </div>
          <div className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Vintage</th>
                  <th className="text-right">NAV ($M)</th>
                  <th className="text-right">DPI</th>
                  <th className="text-right">TVPI</th>
                  <th className="text-right">IRR</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : (
                  (d.fund_performance ?? []).map((fund) => (
                    <tr key={fund.fund}>
                      <td className="font-medium text-gray-900">{fund.fund}</td>
                      <td className="text-gray-600">{fund.vintage}</td>
                      <td className="text-right font-mono">{fund.nav?.toLocaleString() ?? '-'}</td>
                      <td className="text-right font-mono font-semibold text-brand-500">{fund.dpi?.toFixed(1) ?? '-'}x</td>
                      <td className="text-right font-mono font-semibold">{fund.tvpi?.toFixed(1) ?? '-'}x</td>
                      <td className="text-right font-mono">{fund.irr?.toFixed(1) ?? '-'}%</td>
                      <td>
                        <span className={
                          fund.status === 'Harvesting' ? 'tag-green' :
                          fund.status === 'Value Creation' ? 'tag-blue' : 'tag-gray'
                        }>
                          {fund.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOIC Distribution */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Portfolio MOIC Distribution</span>
            <span className="text-xs text-gray-400">All realized and unrealized</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 bg-gray-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={d.moic_distribution ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="moic" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={false} width={28} label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#adb5bd' }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
                          <div className="font-semibold text-gray-700">{label} MOIC</div>
                          <div className="text-gray-600">Companies: <span className="font-mono font-medium">{payload[0].value}</span></div>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine x="2.0x" stroke="#1a56db" strokeDasharray="4 2" label={{ value: 'Median', position: 'top', fontSize: 9, fill: '#1a56db' }} />
                  <Bar dataKey="count" fill="#93c5fd" radius={[2, 2, 0, 0]} name="Companies">
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

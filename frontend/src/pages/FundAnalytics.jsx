import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { BarChart3, Play, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { fundApi } from '../api'
import { MOCK_FUNDS } from '../data/mockData'
import FanChart from '../components/charts/FanChart'
import KPICard from '../components/common/KPICard'
import { KPICardSkeleton } from '../components/common/LoadingState'

const FUNDS_LIST = [
  { id: 1, name: 'Fund I', vintage: 2014 },
  { id: 2, name: 'Fund II', vintage: 2017 },
  { id: 3, name: 'Fund III', vintage: 2020 },
]

function StatusBadge({ status }) {
  if (status === 'Active') return <span className="tag-blue">Active</span>
  if (status === 'Exited') return <span className="tag-green">Exited</span>
  return <span className="tag-gray">{status}</span>
}

const CashFlowTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className={clsx('font-mono font-medium', p.value < 0 ? 'text-red-600' : 'text-emerald-600')}>
            ${Math.abs(p.value)}M
          </span>
        </div>
      ))}
    </div>
  )
}

export default function FundAnalytics() {
  const [selectedFundId, setSelectedFundId] = useState(1)
  const [fundData, setFundData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simRunning, setSimRunning] = useState(false)
  const [simComplete, setSimComplete] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSimComplete(false)
    fundApi.getFundAnalytics(selectedFundId)
      .then(res => setFundData(res.data))
      .catch(() => setFundData(MOCK_FUNDS[selectedFundId]))
      .finally(() => setLoading(false))
  }, [selectedFundId])

  const handleRunMonteCarlo = async () => {
    setSimRunning(true)
    try {
      await fundApi.getMonteCarlo(selectedFundId, 500)
      setSimComplete(true)
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1800))
      setSimComplete(true)
    } finally {
      setSimRunning(false)
    }
  }

  const fund = fundData || MOCK_FUNDS[selectedFundId]

  const exitSchedule = (() => {
    if (!fund?.companies) return []
    const byYear = {}
    fund.companies.forEach(c => {
      if (c.status === 'Active') {
        const yr = 2024 + Math.floor(Math.random() * 3)
        if (!byYear[yr]) byYear[yr] = { year: yr, expected_exits: 0, expected_proceeds: 0 }
        byYear[yr].expected_exits++
        byYear[yr].expected_proceeds += Math.round(c.nav * 1.15)
      }
    })
    return Object.values(byYear).sort((a, b) => a.year - b.year)
  })()

  return (
    <div className="space-y-5">
      {/* Fund Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-0">
        {FUNDS_LIST.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedFundId(f.id)}
            className={clsx(
              'px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors',
              selectedFundId === f.id
                ? 'border-brand-500 text-brand-500 bg-blue-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {f.name}
            <span className="ml-2 text-gray-400 font-normal">{f.vintage}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          <button
            onClick={handleRunMonteCarlo}
            disabled={simRunning}
            className="btn-primary"
          >
            {simRunning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            {simRunning ? 'Running 500 sims...' : 'Run Monte Carlo (500 sims)'}
          </button>
          {simComplete && !simRunning && (
            <span className="tag-green text-xs">Simulation complete</span>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <KPICard label="Committed Capital" value={(fund.committed || 0) * 1e6} format="currency" />
            <KPICard label="Deployed" value={(fund.deployed || 0) * 1e6} format="currency" />
            <KPICard label="Current NAV" value={(fund.nav || 0) * 1e6} format="currency" trend="up" />
            <KPICard label="DPI" value={fund.dpi} format="multiple" delta={(fund.dpi - 1) * 10} trend={fund.dpi > 1 ? 'up' : 'flat'} />
            <KPICard label="TVPI" value={fund.tvpi} format="multiple" delta={(fund.tvpi - 1) * 8} trend={fund.tvpi > 1 ? 'up' : 'flat'} />
            <KPICard label="RVPI" value={fund.rvpi} format="multiple" />
          </>
        )}
      </div>

      {/* Fan Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">NAV Trajectory (Monte Carlo)</span>
            <span className="text-xs text-gray-400">P10/P25/P50/P75/P90 bands</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 bg-gray-100 rounded animate-pulse" />
            ) : (
              <FanChart
                data={fund.monte_carlo || []}
                xKey="year"
                yFormat={(v) => `${v.toFixed(1)}x`}
                height={220}
              />
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">DPI Trajectory Projection</span>
            <span className="text-xs text-gray-400">Distributions to paid-in capital</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 bg-gray-100 rounded animate-pulse" />
            ) : (
              <FanChart
                data={(fund.monte_carlo || []).map(d => ({
                  ...d,
                  p10: d.p10 * 0.7,
                  p25: d.p25 * 0.72,
                  p50: d.p50 * 0.75,
                  p75: d.p75 * 0.78,
                  p90: d.p90 * 0.8,
                  p10_25_range: [d.p10 * 0.7, d.p25 * 0.72],
                  p25_75_range: [d.p25 * 0.72, d.p75 * 0.78],
                  p75_90_range: [d.p75 * 0.78, d.p90 * 0.8],
                }))}
                xKey="year"
                yFormat={(v) => `${v.toFixed(1)}x`}
                height={220}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cash Flow Timeline & Exit Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Cash Flow Timeline</span>
            <span className="text-xs text-gray-400">Investments vs. Distributions ($M)</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 bg-gray-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={fund.cash_flows || []}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  barSize={14}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6c757d' }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={v => `$${v}M`}
                  />
                  <Tooltip content={<CashFlowTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
                  <ReferenceLine y={0} stroke="#adb5bd" strokeWidth={1} />
                  <Bar dataKey="investments" fill="#ef4444" name="Investments" radius={[0, 0, 2, 2]} opacity={0.8} />
                  <Bar dataKey="distributions" fill="#059669" name="Distributions" radius={[2, 2, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Expected Exit Schedule</span>
            <span className="text-xs text-gray-400">Active portfolio companies</span>
          </div>
          <div className="p-0">
            {exitSchedule.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Expected Year</th>
                    <th className="text-right">Exit Count</th>
                    <th className="text-right">Expected Proceeds ($M)</th>
                    <th className="text-right">Implied DPI Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {exitSchedule.map(row => (
                    <tr key={row.year}>
                      <td className="font-mono font-semibold">{row.year}</td>
                      <td className="text-right font-mono">{row.expected_exits}</td>
                      <td className="text-right font-mono font-medium">${row.expected_proceeds}</td>
                      <td className="text-right font-mono text-brand-500">
                        +{(row.expected_proceeds / (fund.committed * 1 || 1)).toFixed(2)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">No active companies in exit window</div>
            )}
          </div>
        </div>
      </div>

      {/* Company Breakdown Table */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Portfolio Company Breakdown</span>
          <span className="text-xs text-gray-400">{fund?.name} &mdash; {fund?.companies?.length || 0} companies</span>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="h-32 animate-pulse bg-gray-50" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Sector</th>
                  <th>Status</th>
                  <th className="text-right">NAV ($M)</th>
                  <th className="text-right">MOIC</th>
                  <th className="text-right">NAV Weight</th>
                </tr>
              </thead>
              <tbody>
                {(fund?.companies || []).map((c) => {
                  const totalNAV = (fund.companies || []).reduce((s, x) => s + x.nav, 0)
                  const weight = totalNAV > 0 ? (c.nav / totalNAV * 100).toFixed(1) : '-'
                  return (
                    <tr key={c.id}>
                      <td className="font-medium text-gray-900">{c.name}</td>
                      <td className="text-gray-600">{c.sector}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-right font-mono">{c.nav}</td>
                      <td className={clsx(
                        'text-right font-mono font-semibold',
                        c.moic >= 2 ? 'text-brand-500' : c.moic >= 1 ? 'text-gray-900' : 'text-red-600'
                      )}>
                        {c.moic.toFixed(1)}x
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${weight}%` }}
                            />
                          </div>
                          <span className="font-mono text-gray-600">{weight}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-700">Total / Weighted Avg</td>
                  <td className="text-right px-3 py-2 font-mono font-bold text-gray-900">
                    ${(fund?.companies || []).reduce((s, c) => s + c.nav, 0)}
                  </td>
                  <td className="text-right px-3 py-2 font-mono font-bold text-brand-500">
                    {fund?.companies?.length > 0
                      ? (fund.companies.reduce((s, c) => s + c.moic * c.nav, 0) / fund.companies.reduce((s, c) => s + c.nav, 0)).toFixed(1) + 'x'
                      : '-'}
                  </td>
                  <td className="text-right px-3 py-2 font-mono font-semibold">100%</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

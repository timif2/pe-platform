import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { Brain, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { companyApi } from '../api'
import { MOCK_COMPANIES } from '../data/mockData'
import SurvivalCurveChart from '../components/charts/SurvivalCurveChart'
import MOICDistributionChart from '../components/charts/MOICDistributionChart'

const HAZARD_COLORS = ['#1a56db', '#0f4c81', '#3b82f6', '#6366f1', '#0891b2']

function ExitProbTable({ survivalData, companyName }) {
  if (!survivalData || survivalData.length === 0) return null
  const rows = []
  for (let i = 0; i < survivalData.length - 1; i++) {
    const t = survivalData[i].time
    const s_t = survivalData[i].probability
    const s_next = survivalData[i + 1]?.probability ?? 0
    const prob_exit = s_t - s_next
    const prob_exit_by = 1 - s_t
    rows.push({ year: t + 1, hazard: prob_exit / (s_t || 1), prob_exit, prob_exit_by: prob_exit_by + prob_exit })
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Year</th>
          <th className="text-right">Hazard Rate</th>
          <th className="text-right">P(Exit this year)</th>
          <th className="text-right">P(Exit by year)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.year}>
            <td className="font-mono">Year {r.year}</td>
            <td className="text-right font-mono">{(r.hazard * 100).toFixed(1)}%</td>
            <td className="text-right font-mono">{(r.prob_exit * 100).toFixed(1)}%</td>
            <td className="text-right font-mono font-semibold text-brand-500">{(r.prob_exit_by * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function WhatIfPanel({ baseP50, onChange }) {
  const [leverage, setLeverage] = useState(5.0)
  const [growth, setGrowth] = useState(20)
  const [margin, setMargin] = useState(30)

  const adjustedMoic = (() => {
    let m = baseP50
    m += (growth - 20) * 0.015
    m -= (leverage - 5) * 0.08
    m += (margin - 30) * 0.01
    return Math.max(0.5, Math.min(5, m))
  })()

  const delta = adjustedMoic - baseP50

  return (
    <div className="panel p-4">
      <div className="panel-title mb-4">What-If Scenario Analysis</div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-600 font-medium">Revenue Growth</label>
            <span className="font-mono text-xs font-semibold text-brand-500">{growth}%</span>
          </div>
          <input
            type="range" min={0} max={50} step={1} value={growth}
            onChange={e => setGrowth(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0%</span><span>50%</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-600 font-medium">Net Leverage</label>
            <span className="font-mono text-xs font-semibold text-brand-500">{leverage.toFixed(1)}x</span>
          </div>
          <input
            type="range" min={1} max={9} step={0.5} value={leverage}
            onChange={e => setLeverage(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1x</span><span>9x</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-600 font-medium">EBITDA Margin</label>
            <span className="font-mono text-xs font-semibold text-brand-500">{margin}%</span>
          </div>
          <input
            type="range" min={5} max={50} step={1} value={margin}
            onChange={e => setMargin(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>5%</span><span>50%</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Base MOIC (P50)</div>
              <div className="font-mono text-lg font-semibold text-gray-700">{baseP50.toFixed(1)}x</div>
            </div>
            <div className="text-2xl text-gray-300">&rarr;</div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Adjusted MOIC</div>
              <div className={clsx('font-mono text-lg font-bold', adjustedMoic > baseP50 ? 'text-emerald-600' : adjustedMoic < baseP50 ? 'text-red-600' : 'text-gray-900')}>
                {adjustedMoic.toFixed(2)}x
              </div>
            </div>
          </div>
          <div className={clsx('text-center mt-2 text-sm font-semibold', delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-500')}>
            {delta > 0 ? '+' : ''}{delta.toFixed(2)}x vs base case
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PredictionsLab() {
  const [companies] = useState(MOCK_COMPANIES)
  const [selectedId, setSelectedId] = useState(MOCK_COMPANIES[0]?.id)
  const [compareIds, setCompareIds] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(false)

  const selectedCompany = companies.find(c => c.id === selectedId)
  const compareCompanies = companies.filter(c => compareIds.includes(c.id))

  useEffect(() => {
    if (!selectedId) return
    if (predictions[selectedId]) return
    setLoading(true)
    companyApi.getPredictions(selectedId)
      .then(res => {
        setPredictions(prev => ({ ...prev, [selectedId]: res.data }))
      })
      .catch(() => {
        const comp = companies.find(c => c.id === selectedId)
        if (comp?.predictions) {
          setPredictions(prev => ({ ...prev, [selectedId]: comp.predictions }))
        }
      })
      .finally(() => setLoading(false))
  }, [selectedId])

  const survivalData = (() => {
    if (!selectedCompany) return []
    const allCompanies = [selectedCompany, ...compareCompanies]
    const allTimes = new Set()
    allCompanies.forEach(c => {
      (c.predictions?.survival_curve || []).forEach(p => allTimes.add(p.time))
    })
    return Array.from(allTimes).sort((a, b) => a - b).map(t => {
      const row = { time: t }
      allCompanies.forEach(c => {
        const point = (c.predictions?.survival_curve || []).find(p => p.time === t)
        row[c.name] = point?.probability ?? null
      })
      return row
    })
  })()

  const allGroupKeys = [selectedCompany?.name, ...compareCompanies.map(c => c.name)].filter(Boolean)

  const hazardData = selectedCompany?.predictions?.survival_curve
    ? selectedCompany.predictions.survival_curve.slice(0, -1).map((p, i) => {
        const next = selectedCompany.predictions.survival_curve[i + 1]
        const h = next ? (p.probability - next.probability) / (p.probability || 1) : 0
        return { year: `Yr ${p.time + 1}`, hazard: parseFloat((h * 100).toFixed(2)) }
      })
    : []

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Brain size={16} className="text-brand-500" />
        <div>
          <div className="text-sm font-semibold text-gray-900">Exit Prediction Engine</div>
          <div className="text-xs text-gray-400">Kaplan-Meier survival models & Monte Carlo MOIC simulation</div>
        </div>
      </div>

      {/* Section 1: Exit Timing */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Exit Timing Model</span>
          <div className="flex items-center gap-3">
            <select
              value={selectedId || ''}
              onChange={e => setSelectedId(parseInt(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Compare toggle */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Compare with:</span>
            {companies.filter(c => c.id !== selectedId).map(c => (
              <button
                key={c.id}
                onClick={() => toggleCompare(c.id)}
                className={clsx(
                  'text-xs px-2 py-0.5 rounded border transition-colors',
                  compareIds.includes(c.id)
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-500'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Kaplan-Meier Survival Curves
            </div>
            {survivalData.length > 0 ? (
              <SurvivalCurveChart
                data={survivalData}
                groups={allGroupKeys}
                height={260}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-gray-400">Select a company</div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Annual Hazard Rate (Conditional Exit Probability)
            </div>
            {hazardData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hazardData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `${v.toFixed(0)}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
                          <div className="font-semibold text-gray-700">{label}</div>
                          <div className="text-gray-600">Hazard Rate: <span className="font-mono font-medium">{payload[0].value.toFixed(1)}%</span></div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="hazard" fill="#1a56db" radius={[2, 2, 0, 0]} name="Hazard Rate %" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-gray-400">No data</div>
            )}
          </div>
        </div>

        {/* Exit Probability Table */}
        {selectedCompany?.predictions?.survival_curve && (
          <div className="px-4 pb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Exit Probability by Year &mdash; {selectedCompany.name}
            </div>
            <ExitProbTable
              survivalData={selectedCompany.predictions.survival_curve}
              companyName={selectedCompany.name}
            />
          </div>
        )}
      </div>

      {/* Section 2: MOIC Prediction */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">MOIC Prediction Model</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{selectedCompany?.name}</span>
          </div>
        </div>
        {selectedCompany?.predictions ? (
          <div className="p-4 grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                MOIC Distribution (Monte Carlo, 500 simulations)
              </div>
              <MOICDistributionChart
                data={selectedCompany.predictions.moic_distribution}
                p10={selectedCompany.predictions.p10}
                p50={selectedCompany.predictions.p50}
                p90={selectedCompany.predictions.p90}
                height={240}
                highlightMoic={selectedCompany.predictions.p50}
              />
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Bear Case (P10)', value: selectedCompany.predictions.p10, color: 'text-gray-700' },
                  { label: 'Base Case (P50)', value: selectedCompany.predictions.p50, color: 'text-brand-500' },
                  { label: 'Bull Case (P90)', value: selectedCompany.predictions.p90, color: 'text-emerald-600' },
                ].map(item => (
                  <div key={item.label} className="panel p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                    <div className={clsx('font-mono text-xl font-bold', item.color)}>
                      {item.value?.toFixed(1)}x
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <WhatIfPanel baseP50={selectedCompany.predictions.p50 || 2.0} />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-400">Select a company to view MOIC predictions</div>
        )}
      </div>
    </div>
  )
}

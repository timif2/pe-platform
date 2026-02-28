import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { FlaskConical, Info } from 'lucide-react'
import clsx from 'clsx'
import { analyticsApi } from '../api'
import { MOCK_COMPANIES, MOCK_SHAP } from '../data/mockData'
import SHAPChart from '../components/charts/SHAPChart'

function FeatureDescriptions({ features }) {
  const DESCRIPTIONS = {
    'Revenue Growth Rate': 'Year-over-year revenue growth; primary driver of value creation in growth-oriented buyouts.',
    'Entry EV/EBITDA': 'Purchase price multiple; higher entry multiples compress potential MOIC.',
    'EBITDA Margin': 'Profitability metric; indicates operational efficiency and pricing power.',
    'Net Leverage': 'Debt/EBITDA at entry; higher leverage amplifies both upside and downside.',
    'Sector (Technology)': 'Sector premium; technology companies command higher exit multiples historically.',
    'Holding Period': 'Time in portfolio; longer holds compress IRR but can increase MOIC.',
    'Geography (NA)': 'North American companies benefit from deeper buyer pools at exit.',
    'Vintage Year': 'Market conditions at entry; pre-crisis vintages face headwind.',
    'Fund Size': 'Larger funds have greater deal sourcing and operational support capability.',
    'Management Tenure': 'Experienced management teams correlate with better execution.',
  }
  const top5 = [...features].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).slice(0, 5)
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th className="text-right">Impact</th>
          <th className="text-right">Direction</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {top5.map((f, i) => (
          <tr key={f.feature}>
            <td className="font-medium text-gray-900">{f.feature}</td>
            <td className="text-right font-mono font-semibold">
              <span className={f.shap_value >= 0 ? 'text-brand-500' : 'text-red-600'}>
                {f.shap_value >= 0 ? '+' : ''}{f.shap_value.toFixed(3)}
              </span>
            </td>
            <td className="text-right">
              {f.shap_value >= 0
                ? <span className="tag-green">Positive</span>
                : <span className="tag-red">Negative</span>
              }
            </td>
            <td className="text-gray-600" style={{ maxWidth: 280 }}>{DESCRIPTIONS[f.feature] || 'Feature impact on predicted MOIC.'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function WaterfallChart({ features, baseValue, prediction }) {
  if (!features) return null
  const sorted = [...features].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).slice(0, 8)

  let cumulative = baseValue
  const bars = sorted.map(f => {
    const start = cumulative
    const end = cumulative + f.shap_value
    cumulative = end
    return { feature: f.feature, start: Math.min(start, end), end: Math.max(start, end), shap: f.shap_value, cumulative: end }
  })

  const allVals = [baseValue, prediction, ...bars.map(b => b.end)]
  const minVal = Math.min(...allVals) - 0.1
  const maxVal = Math.max(...allVals) + 0.1

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded-sm" />
          <span className="text-xs text-gray-500">Positive contribution</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-sm" />
          <span className="text-xs text-gray-500">Negative contribution</span>
        </div>
      </div>
      <div className="space-y-1">
        {/* Base value */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 w-40 text-right flex-shrink-0">Base Value (E[f(x)])</div>
          <div className="flex-1 flex items-center h-6">
            <div
              className="h-4 bg-gray-300 rounded-sm flex items-center justify-end pr-1"
              style={{ width: `${((baseValue - minVal) / (maxVal - minVal)) * 100}%`, minWidth: 4 }}
            />
            <span className="ml-2 text-xs font-mono text-gray-600">{baseValue.toFixed(2)}x</span>
          </div>
        </div>

        {/* Feature contributions */}
        {bars.map((b, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-xs text-gray-600 w-40 text-right flex-shrink-0 truncate" title={b.feature}>
              {b.feature}
            </div>
            <div className="flex-1 flex items-center h-6 relative">
              {/* Connector line */}
              <div
                className="absolute h-0.5 bg-gray-200"
                style={{
                  left: `${((Math.min(b.start, b.end) - minVal) / (maxVal - minVal)) * 100}%`,
                  width: `${(Math.abs(b.shap) / (maxVal - minVal)) * 100}%`,
                }}
              />
              {/* Contribution bar */}
              <div
                className="absolute h-4 rounded-sm"
                style={{
                  left: `${((Math.min(b.start, b.end) - minVal) / (maxVal - minVal)) * 100}%`,
                  width: `${Math.max((Math.abs(b.shap) / (maxVal - minVal)) * 100, 1)}%`,
                  backgroundColor: b.shap >= 0 ? '#3b82f6' : '#ef4444',
                  opacity: 0.8,
                }}
              />
              <span
                className="absolute text-xs font-mono font-semibold"
                style={{
                  left: `calc(${((b.cumulative - minVal) / (maxVal - minVal)) * 100}% + 6px)`,
                  color: b.shap >= 0 ? '#1d4ed8' : '#dc2626',
                }}
              >
                {b.shap >= 0 ? '+' : ''}{b.shap.toFixed(3)}
              </span>
            </div>
          </div>
        ))}

        {/* Prediction */}
        <div className="flex items-center gap-3 border-t border-gray-200 pt-1 mt-1">
          <div className="text-xs font-semibold text-gray-700 w-40 text-right flex-shrink-0">Predicted MOIC</div>
          <div className="flex-1 flex items-center h-6">
            <div
              className="h-4 bg-brand-500 rounded-sm"
              style={{ width: `${((prediction - minVal) / (maxVal - minVal)) * 100}%`, minWidth: 4 }}
            />
            <span className="ml-2 text-xs font-mono font-bold text-brand-500">{prediction.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PartialDependencePlot({ data, xLabel, yLabel = 'Predicted MOIC', height = 160 }) {
  if (!data || data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
        <XAxis
          dataKey="x"
          tick={{ fontSize: 10, fill: '#6c757d' }}
          tickLine={false}
          axisLine={{ stroke: '#dee2e6' }}
          label={{ value: xLabel, position: 'insideBottom', offset: -5, fontSize: 10, fill: '#adb5bd' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6c757d' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={v => `${v.toFixed(1)}x`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs shadow-sm">
                <div className="text-gray-500">{xLabel}: <span className="font-mono font-medium">{label}</span></div>
                <div className="text-gray-600">MOIC: <span className="font-mono font-medium text-brand-500">{payload[0].value.toFixed(2)}x</span></div>
              </div>
            )
          }}
        />
        <Line type="monotone" dataKey="y" stroke="#1a56db" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function Explainability() {
  const [companies] = useState(MOCK_COMPANIES)
  const [selectedId, setSelectedId] = useState(MOCK_COMPANIES[0]?.id)
  const [shapData, setShapData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    analyticsApi.getExplainability(selectedId)
      .then(res => setShapData(res.data))
      .catch(() => setShapData(MOCK_SHAP[selectedId] || MOCK_SHAP[1]))
      .finally(() => setLoading(false))
  }, [selectedId])

  const selectedCompany = companies.find(c => c.id === selectedId)
  const shap = shapData || MOCK_SHAP[selectedId] || MOCK_SHAP[1]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical size={16} className="text-brand-500" />
          <div>
            <div className="text-sm font-semibold text-gray-900">Explainability Lab</div>
            <div className="text-xs text-gray-400">SHAP-based feature attribution for MOIC predictions</div>
          </div>
        </div>
        <select
          value={selectedId || ''}
          onChange={e => setSelectedId(parseInt(e.target.value))}
          className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:border-brand-500 min-w-52"
        >
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.fund})</option>
          ))}
        </select>
      </div>

      {/* Prediction Summary Banner */}
      {shap && (
        <div className="panel p-4 border-l-4 border-brand-500 bg-blue-50/20">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Base Model Value</div>
              <div className="font-mono text-xl font-semibold text-gray-700">{shap.base_value?.toFixed(2)}x</div>
            </div>
            <div className="text-2xl text-gray-300">&rarr;</div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Predicted MOIC</div>
              <div className="font-mono text-2xl font-bold text-brand-500">{shap.prediction?.toFixed(2)}x</div>
            </div>
            <div className="ml-4 flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Company</div>
              <div className="text-sm font-semibold text-gray-900">{selectedCompany?.name}</div>
              <div className="text-xs text-gray-400">{selectedCompany?.sector} &middot; {selectedCompany?.fund}</div>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Feature Importance & Top Features */}
      <div className="grid grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Global Feature Importance</span>
            <span className="text-xs text-gray-400">By absolute SHAP value</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-64 bg-gray-100 rounded animate-pulse" />
            ) : (
              <SHAPChart
                data={shap?.features || []}
                height={280}
              />
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Top 5 Feature Drivers</span>
            <span className="text-xs text-gray-400">{selectedCompany?.name}</span>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="h-64 animate-pulse bg-gray-50" />
            ) : (
              <FeatureDescriptions features={shap?.features || []} />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: SHAP Waterfall & Explanation */}
      <div className="grid grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Prediction Breakdown (SHAP Waterfall)</span>
            <span className="text-xs text-gray-400">How we get from base to prediction</span>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-64 bg-gray-100 rounded animate-pulse" />
            ) : (
              <WaterfallChart
                features={shap?.features}
                baseValue={shap?.base_value}
                prediction={shap?.prediction}
              />
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">AI Explanation</span>
            <span className="text-xs text-gray-400">Natural language interpretation</span>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-2">
                {[80, 90, 75, 85, 60].map((w, i) => (
                  <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2 mb-3">
                  <Info size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {shap?.explanation || 'No explanation available for this company.'}
                  </p>
                </div>
                {shap && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Key Takeaways
                    </div>
                    <div className="space-y-2">
                      {(shap.features || [])
                        .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
                        .slice(0, 3)
                        .map(f => (
                          <div key={f.feature} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                            <span className={clsx(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              f.shap_value >= 0 ? 'bg-blue-500' : 'bg-red-500'
                            )} />
                            <span className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-800">{f.feature}</span>
                              {' '}{f.shap_value >= 0 ? 'adds' : 'subtracts'}{' '}
                              <span className={clsx('font-mono font-semibold', f.shap_value >= 0 ? 'text-blue-600' : 'text-red-600')}>
                                {Math.abs(f.shap_value).toFixed(3)}x
                              </span>
                              {' '}to the predicted MOIC
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Partial Dependence Plots */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Partial Dependence Plots</span>
          <span className="text-xs text-gray-400">How predicted MOIC varies with each feature (ceteris paribus)</span>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          ) : shap?.partial_dependence ? (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
                  Revenue Growth Rate (%) vs MOIC
                </div>
                <PartialDependencePlot
                  data={shap.partial_dependence.revenue_growth}
                  xLabel="Revenue Growth (%)"
                  height={180}
                />
                <p className="text-xs text-gray-400 text-center mt-1">
                  Higher growth strongly predicts higher MOIC
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
                  EBITDA Margin (%) vs MOIC
                </div>
                <PartialDependencePlot
                  data={shap.partial_dependence.ebitda_margin}
                  xLabel="EBITDA Margin (%)"
                  height={180}
                />
                <p className="text-xs text-gray-400 text-center mt-1">
                  Margin expansion contributes positively above 20%
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
                  Net Leverage (x) vs MOIC
                </div>
                <PartialDependencePlot
                  data={shap.partial_dependence.net_leverage}
                  xLabel="Net Leverage (x)"
                  height={180}
                />
                <p className="text-xs text-gray-400 text-center mt-1">
                  Higher leverage negatively impacts expected MOIC
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-gray-400">
              No partial dependence data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

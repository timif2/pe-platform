import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, Cpu, Loader2, ExternalLink } from 'lucide-react'
import { dealsApi } from '../api'
import { MOCK_DEALS, getMockFundModel, QUARTER_KEYS } from '../data/dealsMock'

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const fmt = (n) => n == null ? '—' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
const fmtX = (n) => n == null ? '—' : `${Number(n).toFixed(2)}x`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'
const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KPIStrip({ deal }) {
  if (!deal) return null
  return (
    <div className="grid grid-cols-5 gap-3">
      {[
        { label: 'Committed', value: fmt(deal.committed_m) },
        { label: 'Total NAV', value: fmt(deal.total_nav_m) },
        { label: 'MOIC', value: fmtX(deal.moic) },
        { label: 'Funds', value: deal.fund_ids?.length ?? '—' },
        { label: 'Companies', value: deal.total_companies ?? '—' },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white rounded-lg shadow-sm px-4 py-3">
          <div className="text-xs text-gray-400 mb-1">{label}</div>
          <div className="text-lg font-bold font-mono text-gray-900">{value}</div>
        </div>
      ))}
    </div>
  )
}

function FundTabs({ fundIds, activeFundId, onSelect, fundModels }) {
  return (
    <div className="flex gap-1 border-b border-gray-200">
      {fundIds.map(fid => {
        const model = fundModels[fid]
        const label = model?.fund_name ?? fid
        const active = fid === activeFundId
        return (
          <button
            key={fid}
            onClick={() => onSelect(fid)}
            className={[
              'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px',
              active
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editable cell
// ---------------------------------------------------------------------------

function EditableNavCell({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n)) onChange(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="number"
        step="0.1"
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-20 px-1 py-0.5 text-xs font-mono border border-brand-500 rounded outline-none bg-blue-50"
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}
      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 text-xs font-mono text-gray-700"
      title="Click to edit"
    >
      {value != null ? fmtNum(value) : '—'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ML prediction badge
// ---------------------------------------------------------------------------

function PredCell({ value, format, predicting }) {
  if (predicting) {
    return (
      <span className="flex items-center gap-1 text-xs text-blue-400">
        <Loader2 size={11} className="animate-spin" />
      </span>
    )
  }
  return (
    <span className="text-xs font-mono bg-blue-50 text-blue-700 rounded px-1 py-0.5">
      {format(value)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Primary Fund Model Table
// ---------------------------------------------------------------------------

function FundModelTable({ model, navEdits, onNavEdit, predicting, predictions, quarterKeys }) {
  if (!model) return (
    <div className="bg-white rounded-lg shadow-sm flex items-center justify-center h-40 text-sm text-gray-400">
      Loading fund model…
    </div>
  )

  const { companies, totals } = model
  const qKeys = quarterKeys || model.quarter_keys || QUARTER_KEYS

  // Merge predictions into rows
  const rows = companies.map(c => {
    const pred = predictions[c.id]
    return {
      ...c,
      exit_date: pred?.exit_date ?? c.exit_date,
      cost_x: pred?.cost_x ?? c.cost_x,
      nav_x: pred?.nav_x ?? c.nav_x,
    }
  })

  // Recompute totals with nav edits
  const editedTotals = { ...totals, quarterly_navs: { ...totals.quarterly_navs } }
  qKeys.forEach(k => {
    editedTotals.quarterly_navs[k] = rows.reduce((s, c) => {
      const edited = navEdits[c.id]?.[k]
      return s + (edited != null ? edited : (c.quarterly_navs[k] ?? 0))
    }, 0)
    editedTotals.quarterly_navs[k] = Math.round(editedTotals.quarterly_navs[k] * 10) / 10
  })

  const thClass = 'px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50'
  const tdClass = 'px-3 py-2 text-xs text-gray-700 whitespace-nowrap'
  const tdNumClass = 'px-3 py-2 text-xs font-mono text-gray-700 whitespace-nowrap text-right'
  const totalsClass = 'px-3 py-2.5 text-xs font-semibold text-gray-900 whitespace-nowrap bg-gray-50'
  const totalsNumClass = 'px-3 py-2.5 text-xs font-mono font-semibold text-gray-900 whitespace-nowrap text-right bg-gray-50'

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {/* Sticky company column */}
              <th className={`${thClass} sticky left-0 z-10 min-w-[160px]`}>Company</th>
              <th className={`${thClass} min-w-[90px]`}>Exit Date</th>
              <th className={`${thClass} min-w-[80px] text-right`}>Cost ($M)</th>
              <th className={`${thClass} min-w-[90px] text-right`}>Proceeds ($M)</th>
              <th className={`${thClass} min-w-[80px] text-right`}>NAV ($M)</th>
              <th className={`${thClass} min-w-[100px] text-right`}>Exit Value ($M)</th>
              <th className={`${thClass} min-w-[70px] text-right`} title="ML-predicted cost multiple">Cost X</th>
              <th className={`${thClass} min-w-[70px] text-right`} title="ML-predicted NAV multiple">NAV X</th>
              {qKeys.map(k => (
                <th key={k} className={`${thClass} min-w-[90px] text-right`}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c, idx) => {
              const isPredicting = predicting.has(c.id)
              const isEven = idx % 2 === 0
              const rowBg = isEven ? 'bg-white' : 'bg-gray-50/40'

              return (
                <tr key={c.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${rowBg}`}>
                  {/* Sticky company name */}
                  <td className={`${tdClass} sticky left-0 z-10 ${rowBg}`}>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/portfolio/${c.id}`}
                        className="text-brand-500 hover:underline font-medium flex items-center gap-0.5"
                        title="Open Company Sheet"
                      >
                        {c.name}
                        <ExternalLink size={10} className="opacity-60" />
                      </Link>
                    </div>
                    <div className="text-gray-400 text-[10px] mt-0.5">{c.sector}</div>
                  </td>

                  {/* Exit Date — ML predicted */}
                  <td className={tdClass}>
                    <PredCell value={c.exit_date} format={fmtDate} predicting={isPredicting} />
                    {c.status === 'exited' && !isPredicting && (
                      <div className="text-[10px] text-gray-400 mt-0.5">Realised</div>
                    )}
                  </td>

                  <td className={tdNumClass}>{fmt(c.cost_m)}</td>
                  <td className={tdNumClass}>{fmt(c.proceeds_m)}</td>
                  <td className={tdNumClass}>{fmt(c.nav_m)}</td>
                  <td className={tdNumClass}>{fmt(c.exit_value_m)}</td>

                  {/* Cost X — ML */}
                  <td className={`${tdNumClass}`}>
                    <PredCell value={c.cost_x} format={fmtX} predicting={isPredicting} />
                  </td>

                  {/* NAV X — ML */}
                  <td className={`${tdNumClass}`}>
                    <PredCell value={c.nav_x} format={fmtX} predicting={isPredicting} />
                  </td>

                  {/* Quarterly NAV — editable */}
                  {qKeys.map(k => {
                    const editedVal = navEdits[c.id]?.[k]
                    const displayVal = editedVal != null ? editedVal : c.quarterly_navs?.[k]
                    return (
                      <td key={k} className={`${tdNumClass}`}>
                        <EditableNavCell
                          value={displayVal}
                          onChange={v => onNavEdit(c.id, k, v)}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>

          {/* Totals / Cash Flows row */}
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td className={`${totalsClass} sticky left-0 z-10`}>
                Cash Flows from Existing Portfolio
              </td>
              <td className={totalsClass} />
              <td className={totalsNumClass}>{fmt(editedTotals.cost_m)}</td>
              <td className={totalsNumClass}>{fmt(editedTotals.proceeds_m)}</td>
              <td className={totalsNumClass}>{fmt(editedTotals.nav_m)}</td>
              <td className={totalsNumClass}>{fmt(editedTotals.exit_value_m)}</td>
              <td className={totalsNumClass}>{fmtX(editedTotals.cost_x)}</td>
              <td className={totalsNumClass}>{fmtX(editedTotals.nav_x)}</td>
              {qKeys.map(k => (
                <td key={k} className={totalsNumClass}>
                  {fmtNum(editedTotals.quarterly_navs[k])}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DealView (main page)
// ---------------------------------------------------------------------------

export default function DealView() {
  const { dealId } = useParams()
  const navigate = useNavigate()

  const [deal, setDeal] = useState(null)
  const [activeFundId, setActiveFundId] = useState(null)
  const [fundModels, setFundModels] = useState({}) // fundId → model
  const [loading, setLoading] = useState(true)
  const [modelLoading, setModelLoading] = useState(false)

  // ML prediction state
  const [predicting, setPredicting] = useState(new Set()) // set of company IDs
  const [predictions, setPredictions] = useState({}) // companyId → {exit_date, cost_x, nav_x}

  // Editable quarterly NAV state: { [companyId]: { [quarterKey]: number } }
  const [navEdits, setNavEdits] = useState({})

  const handleNavEdit = useCallback((companyId, quarterKey, value) => {
    setNavEdits(prev => ({
      ...prev,
      [companyId]: { ...(prev[companyId] || {}), [quarterKey]: value },
    }))
  }, [])

  // Load deal metadata
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    dealsApi.getDeal(dealId)
      .then(res => {
        if (!cancelled) {
          setDeal(res.data)
          setActiveFundId(res.data.fund_ids?.[0] ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          const mockDeal = MOCK_DEALS.find(d => d.id === dealId) || MOCK_DEALS[0]
          setDeal(mockDeal)
          setActiveFundId(mockDeal.fund_ids?.[0] ?? null)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [dealId])

  // Load fund model when active fund changes
  useEffect(() => {
    if (!activeFundId || fundModels[activeFundId]) return
    let cancelled = false
    setModelLoading(true)
    dealsApi.getFundModel(dealId, activeFundId)
      .then(res => {
        if (!cancelled) setFundModels(prev => ({ ...prev, [activeFundId]: res.data }))
      })
      .catch(() => {
        if (!cancelled) {
          const mockModel = getMockFundModel(activeFundId)
          if (mockModel) setFundModels(prev => ({ ...prev, [activeFundId]: mockModel }))
        }
      })
      .finally(() => { if (!cancelled) setModelLoading(false) })
    return () => { cancelled = true }
  }, [activeFundId, dealId, fundModels])

  // Run ML predictions for all companies in active fund
  const runPredictions = useCallback(async (companyIds) => {
    if (!companyIds?.length) return
    const ids = companyIds.filter(id => id !== '__totals__')
    setPredicting(new Set(ids))
    try {
      const res = await dealsApi.predict(ids)
      setPredictions(prev => ({ ...prev, ...res.data }))
    } catch {
      // fallback: generate plausible mock predictions
      const mockPreds = {}
      const currentYear = new Date().getFullYear()
      ids.forEach(id => {
        mockPreds[id] = {
          exit_date: `${currentYear + 2 + Math.floor(Math.random() * 3)}-06-30`,
          cost_x: 1.0,
          nav_x: parseFloat((1.4 + Math.random() * 1.2).toFixed(2)),
        }
      })
      setPredictions(prev => ({ ...prev, ...mockPreds }))
    } finally {
      setPredicting(new Set())
    }
  }, [])

  const activeModel = activeFundId ? fundModels[activeFundId] : null
  const activeCompanyIds = activeModel?.companies?.map(c => c.id) ?? []
  const quarterKeys = activeModel?.quarter_keys ?? QUARTER_KEYS

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-5 gap-3">
          {[0,1,2,3,4].map(i => <div key={i} className="bg-white rounded-lg shadow-sm h-16 bg-gray-100" />)}
        </div>
        <div className="bg-white rounded-lg shadow-sm h-64 bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <button onClick={() => navigate('/deals')} className="hover:text-brand-500 transition-colors">Deals</button>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">{deal?.name}</span>
      </nav>

      {/* Deal header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{deal?.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{deal?.description}</p>
      </div>

      {/* KPI strip */}
      <KPIStrip deal={deal} />

      {/* Fund tabs */}
      {deal?.fund_ids?.length > 0 && (
        <FundTabs
          fundIds={deal.fund_ids}
          activeFundId={activeFundId}
          onSelect={setActiveFundId}
          fundModels={fundModels}
        />
      )}

      {/* Primary Fund Model panel */}
      <div className="space-y-3">
        {/* Table toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Primary Fund Model</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeModel
                ? `${activeModel.companies.length} companies · Quarterly NAV cells are editable`
                : 'Loading…'}
            </p>
          </div>
          <button
            onClick={() => runPredictions(activeCompanyIds)}
            disabled={predicting.size > 0 || !activeModel}
            className={[
              'flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors',
              predicting.size > 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-500 text-white hover:bg-brand-600',
            ].join(' ')}
          >
            {predicting.size > 0
              ? <><Loader2 size={13} className="animate-spin" /> Running…</>
              : <><Cpu size={13} /> Run All Predictions</>
            }
          </button>
        </div>

        {/* Table */}
        {modelLoading ? (
          <div className="bg-white rounded-lg shadow-sm flex items-center justify-center h-48 animate-pulse">
            <div className="text-sm text-gray-400">Loading fund model…</div>
          </div>
        ) : (
          <FundModelTable
            model={activeModel}
            navEdits={navEdits}
            onNavEdit={handleNavEdit}
            predicting={predicting}
            predictions={predictions}
            quarterKeys={quarterKeys}
          />
        )}
      </div>
    </div>
  )
}

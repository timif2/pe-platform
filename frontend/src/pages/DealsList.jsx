import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, TrendingUp, Building2, DollarSign, ChevronRight } from 'lucide-react'
import { dealsApi } from '../api'
import { MOCK_DEALS, MOCK_DEALS_OVERVIEW } from '../data/dealsMock'

const fmt = (n) => n == null ? '—' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}M`
const fmtX = (n) => n == null ? '—' : `${Number(n).toFixed(2)}x`

function KPICard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 font-mono">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Active'
    ? 'tag-green'
    : status === 'Realised'
    ? 'tag-gray'
    : 'tag-blue'
  return <span className={cls}>{status}</span>
}

export default function DealsList() {
  const navigate = useNavigate()
  const [deals, setDeals] = useState(null)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    dealsApi.getDeals()
      .then(res => {
        if (!cancelled) {
          setDeals(res.data)
          // Compute overview from returned data
          const d = res.data
          setOverview({
            total_aum_m: d.reduce((s, x) => s + (x.total_nav_m || 0), 0),
            active_deals: d.filter(x => x.status === 'Active').length,
            total_funds: d.reduce((s, x) => s + (x.fund_ids?.length || 0), 0),
            total_companies: d.reduce((s, x) => s + (x.total_companies || 0), 0),
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeals(MOCK_DEALS)
          setOverview(MOCK_DEALS_OVERVIEW)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const d = deals || MOCK_DEALS
  const o = overview || MOCK_DEALS_OVERVIEW

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Deals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Transaction-level view — click a deal to open the fund model</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Total NAV"
          value={fmt(o.total_aum_m)}
          sub="Across all active deals"
        />
        <KPICard
          label="Active Deals"
          value={o.active_deals}
          sub="Transactions"
        />
        <KPICard
          label="Total Funds"
          value={o.total_funds}
          sub="Underlying fund vehicles"
        />
        <KPICard
          label="Portfolio Companies"
          value={o.total_companies}
          sub="Across all deals"
        />
      </div>

      {/* Deal cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {d.map(deal => (
            <button
              key={deal.id}
              onClick={() => navigate(`/deals/${deal.id}`)}
              className="bg-white rounded-lg shadow-sm p-4 text-left hover:shadow-md transition-all duration-150 group"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={deal.status} />
                    <span className="text-xs text-gray-400">Vintage {deal.vintage}</span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-brand-500 transition-colors">
                    {deal.name}
                  </h2>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-500 flex-shrink-0 mt-1" />
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{deal.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Committed</div>
                  <div className="text-sm font-semibold font-mono text-gray-900">{fmt(deal.committed_m)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">NAV</div>
                  <div className="text-sm font-semibold font-mono text-gray-900">{fmt(deal.total_nav_m)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">MOIC</div>
                  <div className="text-sm font-semibold font-mono text-gray-900">{fmtX(deal.moic)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Companies</div>
                  <div className="text-sm font-semibold font-mono text-gray-900">{deal.total_companies}</div>
                </div>
              </div>

              {/* Fund count chip */}
              <div className="mt-3 flex items-center gap-1.5">
                <Layers size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {deal.fund_ids?.length || 0} fund{(deal.fund_ids?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, List, Filter, ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'
import { portfolioApi } from '../api'
import { MOCK_COMPANIES } from '../data/mockData'

const SECTORS = ['Technology', 'Healthcare', 'Industrials', 'Consumer', 'Financial Services', 'Energy', 'Education', 'Media', 'Hospitality', 'Agriculture']
const GEOGRAPHIES = ['North America', 'Europe', 'Asia-Pacific', 'Latin America']
const FUNDS = ['Fund I', 'Fund II', 'Fund III']
const STATUSES = ['All', 'Active', 'Exited']

function StatusBadge({ status }) {
  if (status === 'Active') return <span className="tag-blue">Active</span>
  if (status === 'Exited') return <span className="tag-green">Exited</span>
  if (status === 'At Risk') return <span className="tag-amber">At Risk</span>
  return <span className="tag-gray">{status}</span>
}

function formatMoic(v) {
  if (v === null || v === undefined) return '-'
  return `${v.toFixed(1)}x`
}

function formatCurrency(v, suffix = 'M') {
  if (v === null || v === undefined) return '-'
  return `$${v.toLocaleString()}${suffix}`
}

function formatPct(v) {
  if (v === null || v === undefined) return '-'
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

function CompanyCard({ company, onClick }) {
  return (
    <div
      className="panel p-4 cursor-pointer hover:border-brand-500 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-gray-900">{company.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{company.fund} &middot; {company.vintage_year}</div>
        </div>
        <StatusBadge status={company.status} />
      </div>
      <div className="flex gap-2 mb-3">
        <span className="tag-gray text-xs">{company.sector}</span>
        <span className="tag-gray text-xs">{company.geography}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide" style={{ fontSize: 10 }}>NAV</div>
          <div className="font-mono text-xs font-semibold text-gray-900">{formatCurrency(company.current_nav)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide" style={{ fontSize: 10 }}>MOIC</div>
          <div className={clsx('font-mono text-xs font-semibold', company.moic >= 2 ? 'text-brand-500' : company.moic >= 1 ? 'text-gray-900' : 'text-red-600')}>
            {formatMoic(company.moic)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide" style={{ fontSize: 10 }}>IRR</div>
          <div className="font-mono text-xs font-semibold text-gray-900">{company.irr?.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

function FilterSidebar({ filters, setFilters }) {
  const toggle = (key, value) => {
    setFilters(prev => {
      const arr = prev[key] || []
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      }
    })
  }

  const CheckItem = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-gray-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3 h-3 rounded border-gray-300 text-brand-500 focus:ring-0"
      />
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  )

  return (
    <div className="w-48 flex-shrink-0 space-y-4">
      {/* Status */}
      <div>
        <div className="panel-title mb-2">Status</div>
        <div className="flex flex-col gap-1">
          {STATUSES.filter(s => s !== 'All').map(s => (
            <CheckItem
              key={s}
              label={s}
              checked={(filters.status || []).includes(s)}
              onChange={() => toggle('status', s)}
            />
          ))}
        </div>
      </div>

      {/* Fund */}
      <div>
        <div className="panel-title mb-2">Fund</div>
        <div className="flex flex-col gap-1">
          {FUNDS.map(f => (
            <CheckItem
              key={f}
              label={f}
              checked={(filters.fund || []).includes(f)}
              onChange={() => toggle('fund', f)}
            />
          ))}
        </div>
      </div>

      {/* Sector */}
      <div>
        <div className="panel-title mb-2">Sector</div>
        <div className="flex flex-col gap-1">
          {SECTORS.map(s => (
            <CheckItem
              key={s}
              label={s}
              checked={(filters.sector || []).includes(s)}
              onChange={() => toggle('sector', s)}
            />
          ))}
        </div>
      </div>

      {/* Geography */}
      <div>
        <div className="panel-title mb-2">Geography</div>
        <div className="flex flex-col gap-1">
          {GEOGRAPHIES.map(g => (
            <CheckItem
              key={g}
              label={g}
              checked={(filters.geography || []).includes(g)}
              onChange={() => toggle('geography', g)}
            />
          ))}
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={() => setFilters({})}
        className="btn-secondary w-full justify-center text-xs"
      >
        <X size={11} /> Clear Filters
      </button>
    </div>
  )
}

export default function Portfolio() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  useEffect(() => {
    setLoading(true)
    portfolioApi.getPortfolio()
      .then(res => setCompanies(res.data))
      .catch(() => setCompanies(MOCK_COMPANIES))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = [...companies]
    if (filters.status?.length) list = list.filter(c => filters.status.includes(c.status))
    if (filters.fund?.length) list = list.filter(c => filters.fund.includes(c.fund))
    if (filters.sector?.length) list = list.filter(c => filters.sector.includes(c.sector))
    if (filters.geography?.length) list = list.filter(c => filters.geography.includes(c.geography))

    list.sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [companies, filters, sort])

  const activeFilterCount = Object.values(filters).reduce((n, arr) => n + (arr?.length || 0), 0)

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const SortHeader = ({ col, label, right }) => (
    <th
      className={clsx('cursor-pointer select-none hover:bg-gray-100 transition-colors', right && 'text-right')}
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1" style={{ justifyContent: right ? 'flex-end' : 'flex-start' }}>
        {label}
        {sort.key === col && <span className="text-brand-500">{sort.dir === 'asc' ? '\u2191' : '\u2193'}</span>}
      </span>
    </th>
  )

  return (
    <div className="flex gap-5">
      {/* Filter Sidebar */}
      <div className="panel p-4 h-fit sticky top-0">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={13} className="text-gray-500" />
          <span className="panel-title">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-auto inline-flex items-center justify-center w-4 h-4 bg-brand-500 text-white text-xs rounded-full" style={{ fontSize: 10 }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        <FilterSidebar filters={filters} setFilters={setFilters} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">{filtered.length} Companies</span>
            {activeFilterCount > 0 && (
              <span className="tag-blue">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('p-1.5 rounded', viewMode === 'grid' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50')}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('p-1.5 rounded', viewMode === 'list' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50')}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="panel p-4 h-32 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(company => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={() => navigate(`/portfolio/${company.id}`)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 panel p-8 text-center text-xs text-gray-400">
                No companies match the selected filters.
              </div>
            )}
          </div>
        ) : (
          <div className="panel">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader col="name" label="Company" />
                  <SortHeader col="fund" label="Fund" />
                  <SortHeader col="sector" label="Sector" />
                  <SortHeader col="geography" label="Geography" />
                  <SortHeader col="entry_ev" label="Entry EV ($M)" right />
                  <SortHeader col="current_nav" label="Current NAV ($M)" right />
                  <SortHeader col="moic" label="MOIC" right />
                  <SortHeader col="revenue_growth" label="Rev Growth" right />
                  <SortHeader col="ebitda_margin" label="EBITDA Mgn" right />
                  <SortHeader col="holding_period_years" label="Hold (yrs)" right />
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(company => (
                  <tr
                    key={company.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/portfolio/${company.id}`)}
                  >
                    <td>
                      <div className="font-medium text-gray-900">{company.name}</div>
                    </td>
                    <td className="text-gray-600">{company.fund}</td>
                    <td className="text-gray-600">{company.sector}</td>
                    <td className="text-gray-600">{company.geography}</td>
                    <td className="text-right font-mono">{formatCurrency(company.entry_ev)}</td>
                    <td className="text-right font-mono font-medium">{formatCurrency(company.current_nav)}</td>
                    <td className={clsx(
                      'text-right font-mono font-semibold',
                      company.moic >= 2 ? 'text-brand-500' : company.moic >= 1 ? 'text-gray-900' : 'text-red-600'
                    )}>
                      {formatMoic(company.moic)}
                    </td>
                    <td className={clsx('text-right font-mono', company.revenue_growth > 0 ? 'text-emerald-700' : 'text-red-600')}>
                      {formatPct(company.revenue_growth)}
                    </td>
                    <td className="text-right font-mono">{company.ebitda_margin?.toFixed(1)}%</td>
                    <td className="text-right font-mono">{company.holding_period_years?.toFixed(1)}</td>
                    <td><StatusBadge status={company.status} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-400">
                      No companies match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import {
  Building2, Globe, Upload, X, ChevronDown, ChevronUp,
  FileText, BarChart2, Send, Loader2, Sparkles, CheckSquare,
  Square, Info, AlertCircle, TrendingUp, Shield, Zap,
  Users, Calendar, DollarSign, Activity, Target
} from 'lucide-react'
import { intelligenceApi, portfolioApi } from '../api'
import { MOCK_COMPANIES } from '../data/mockData'

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const FINANCIAL_METRICS = [
  { key: 'revenue',       label: 'Revenue / Sales',     description: 'Total annual revenue' },
  { key: 'ebitda',        label: 'EBITDA',               description: 'Earnings before interest, tax, depreciation & amortisation' },
  { key: 'net_debt',      label: 'Net Debt',             description: 'Total debt minus cash' },
  { key: 'ebitda_margin', label: 'EBITDA Margin %',      description: 'EBITDA as a percentage of revenue' },
  { key: 'revenue_growth',label: 'Revenue Growth %',     description: 'Year-on-year revenue growth rate' },
  { key: 'ebitda_cagr',   label: 'EBITDA CAGR',         description: 'Compound annual growth rate of EBITDA over projection period' },
  { key: 'sales_cagr',    label: 'Sales CAGR',           description: 'Compound annual growth rate of revenue over projection period' },
  { key: 'leverage',      label: 'Net Debt / EBITDA',    description: 'Leverage ratio' },
]

// ─────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────

function SectionBadge({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
      {label}
    </span>
  )
}

function InfoBox({ children }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
      <Info size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
      <div>{children}</div>
    </div>
  )
}

function Checkbox({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-left group"
    >
      <div className="mt-0.5 flex-shrink-0">
        {checked
          ? <CheckSquare size={18} className="text-brand-500" />
          : <Square size={18} className="text-gray-400 group-hover:text-gray-600" />}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// Company Sheet result renderer
// ─────────────────────────────────────────────────────────

function CompanySheetResult({ data, companyName }) {
  const [openSections, setOpenSections] = useState({
    overview: true, description: true, financials: true,
    history: false, management: false, swot: false,
    debt_capital: false, corporate_events: false,
    projections: false, exit_view: false, exit_signals: false,
  })

  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }))

  const Section = ({ id, title, icon: Icon, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-brand-500" />
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        {openSections[id] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {openSections[id] && (
        <div className="px-4 py-4 bg-white text-sm text-gray-700 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
          <FileText size={15} />
        </div>
        <div>
          <div className="text-base font-bold text-gray-900">{companyName} — Company Sheet</div>
          <div className="text-xs text-gray-400">AI-generated · For internal use only</div>
        </div>
      </div>

      <Section id="overview" title="Business Overview" icon={Building2}>
        <p>{data.overview}</p>
      </Section>

      <Section id="description" title="Business Description" icon={Activity}>
        <p>{data.description}</p>
      </Section>

      <Section id="financials" title="Entry Financials" icon={DollarSign}>
        {Array.isArray(data.financials) && data.financials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 pr-4 font-semibold text-gray-500">Year</th>
                  <th className="text-right py-1.5 pr-4 font-semibold text-gray-500">Revenue (€M)</th>
                  <th className="text-right py-1.5 pr-4 font-semibold text-gray-500">EBITDA (€M)</th>
                  <th className="text-right py-1.5 font-semibold text-gray-500">Net Debt (€M)</th>
                </tr>
              </thead>
              <tbody>
                {data.financials.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 pr-4 font-mono font-medium">{row.year}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{row.revenue}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{row.ebitda}</td>
                    <td className="py-1.5 text-right font-mono">{row.net_debt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{typeof data.financials === 'string' ? data.financials : 'No financial data available.'}</p>
        )}
      </Section>

      <Section id="history" title="Company History" icon={Calendar}>
        <p className="whitespace-pre-line">{data.history}</p>
      </Section>

      <Section id="management" title="Management Team" icon={Users}>
        {Array.isArray(data.management) ? (
          <div className="space-y-3">
            {data.management.map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded bg-gray-50 border border-gray-100">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {m.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{m.name}</div>
                  <div className="text-xs text-brand-500 font-medium">{m.title}</div>
                  {m.notes && <div className="text-xs text-gray-500 mt-0.5">{m.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>{data.management}</p>
        )}
      </Section>

      <Section id="swot" title="SWOT Analysis" icon={Shield}>
        {data.swot && typeof data.swot === 'object' ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'strengths',    label: 'Strengths',    color: 'bg-green-50 border-green-200 text-green-800' },
              { key: 'weaknesses',   label: 'Weaknesses',   color: 'bg-red-50 border-red-200 text-red-800' },
              { key: 'opportunities',label: 'Opportunities', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { key: 'threats',      label: 'Threats',      color: 'bg-orange-50 border-orange-200 text-orange-800' },
            ].map(({ key, label, color }) => (
              <div key={key} className={`rounded border p-3 ${color}`}>
                <div className="font-semibold text-xs mb-1.5 uppercase tracking-wide">{label}</div>
                <p className="text-xs leading-relaxed">{data.swot[key]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>{data.swot}</p>
        )}
      </Section>

      <Section id="debt_capital" title="Debt & Capital Structure" icon={TrendingUp}>
        <p className="whitespace-pre-line">{data.debt_capital}</p>
      </Section>

      <Section id="corporate_events" title="Corporate Events" icon={Zap}>
        <p className="whitespace-pre-line">{data.corporate_events}</p>
      </Section>

      <Section id="projections" title="Projections" icon={BarChart2}>
        <p className="whitespace-pre-line">{data.projections}</p>
      </Section>

      <Section id="exit_view" title="Exit View" icon={Target}>
        <p className="whitespace-pre-line">{data.exit_view}</p>
      </Section>

      <Section id="exit_signals" title="Exit Signals" icon={Activity}>
        {Array.isArray(data.exit_signals) ? (
          <ul className="space-y-2">
            {data.exit_signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{data.exit_signals}</p>
        )}
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Business Plan result renderer
// ─────────────────────────────────────────────────────────

function BusinessPlanResult({ data, companyName }) {
  const [openSections, setOpenSections] = useState({
    summary: true, market_analysis: true, strategy: true,
    financials: true, risks: false, conclusion: false,
  })
  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }))

  const Section = ({ id, title, icon: Icon, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-brand-500" />
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        {openSections[id] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {openSections[id] && (
        <div className="px-4 py-4 bg-white text-sm text-gray-700 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )

  const financialRows = data.financials || []
  const metricKeys = financialRows.length > 0
    ? Object.keys(financialRows[0]).filter(k => k !== 'year')
    : []

  const metricLabel = (key) => {
    const m = FINANCIAL_METRICS.find(x => x.key === key)
    return m ? m.label : key
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700">
          <BarChart2 size={15} />
        </div>
        <div>
          <div className="text-base font-bold text-gray-900">{companyName} — Business Plan</div>
          <div className="text-xs text-gray-400">AI-generated · For internal use only</div>
        </div>
      </div>

      <Section id="summary" title="Executive Summary" icon={FileText}>
        <p>{data.summary}</p>
      </Section>

      <Section id="market_analysis" title="Market Analysis" icon={Globe}>
        <p className="whitespace-pre-line">{data.market_analysis}</p>
      </Section>

      <Section id="strategy" title="Strategic Plan" icon={Target}>
        <p className="whitespace-pre-line">{data.strategy}</p>
      </Section>

      <Section id="financials" title="Financial Projections" icon={DollarSign}>
        {financialRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-500">Year</th>
                  {metricKeys.map(k => (
                    <th key={k} className="text-right py-2 pr-4 font-semibold text-gray-500 whitespace-nowrap">
                      {metricLabel(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financialRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono font-medium">{row.year}</td>
                    {metricKeys.map(k => (
                      <td key={k} className="py-2 pr-4 text-right font-mono">
                        {row[k] !== undefined ? row[k] : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No financial projections available.</p>
        )}
      </Section>

      <Section id="risks" title="Risks & Mitigants" icon={Shield}>
        <p className="whitespace-pre-line">{data.risks}</p>
      </Section>

      <Section id="conclusion" title="Conclusion" icon={Activity}>
        <p className="whitespace-pre-line">{data.conclusion}</p>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────

function ChatBox({ companyName, contextSummary }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const q = input.trim()
    if (!q || !companyName) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await intelligenceApi.chat({
        company_name: companyName,
        question: q,
        existing_context: contextSummary || null,
      })
      const answer = res.data?.answer || 'No response received.'
      setMessages(m => [...m, { role: 'assistant', text: answer }])
    } catch {
      // fallback mock
      const { _mock_chat_answer } = await import('../data/intelligenceMock')
      setMessages(m => [...m, { role: 'assistant', text: _mock_chat_answer(companyName, q) }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="panel flex flex-col" style={{ minHeight: 260 }}>
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-3">
        <Sparkles size={14} className="text-brand-500" />
        <span className="text-sm font-semibold text-gray-800">Ask about this company</span>
        {!companyName && (
          <span className="text-xs text-gray-400 ml-2">— select a company above first</span>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 space-y-3 overflow-y-auto mb-4" style={{ maxHeight: 340 }}>
        {messages.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-8">
            Ask anything about {companyName || 'the selected company'} — financials, management, exit strategy, SWOT…
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-prose px-3 py-2 rounded-lg text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg">
              <Loader2 size={14} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-gray-100 pt-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={companyName ? `What would you like to know about ${companyName}?` : 'Select a company first…'}
          disabled={!companyName || loading}
          rows={2}
          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={send}
          disabled={!input.trim() || !companyName || loading}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────

export default function CompanyIntelligence() {
  // Company selection state
  const [mode, setMode] = useState('portfolio') // 'portfolio' | 'new'
  const [portfolioCompanies, setPortfolioCompanies] = useState(MOCK_COMPANIES)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('')

  // Output checkboxes
  const [wantSheet, setWantSheet] = useState(true)
  const [wantPlan, setWantPlan] = useState(false)

  // Business plan metric selection
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'ebitda', 'net_debt'])

  // Document upload (for company sheet)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

  // Results
  const [sheetData, setSheetData] = useState(null)
  const [planData, setPlanData] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Context for chat (serialised summaries from generated outputs)
  const [chatContext, setChatContext] = useState('')

  // Fetch portfolio companies on mount
  useEffect(() => {
    portfolioApi.getPortfolio()
      .then(res => {
        if (res.data?.companies?.length) setPortfolioCompanies(res.data.companies)
        else if (Array.isArray(res.data) && res.data.length) setPortfolioCompanies(res.data)
      })
      .catch(() => setPortfolioCompanies(MOCK_COMPANIES))
  }, [])

  // Derived company info
  const selectedPortfolioCompany = portfolioCompanies.find(c => String(c.id) === String(selectedCompanyId))
  const companyName = mode === 'portfolio'
    ? (selectedPortfolioCompany?.name || '')
    : newCompanyName.trim()
  const companyWebsite = mode === 'portfolio'
    ? (selectedPortfolioCompany?.website || null)
    : newCompanyWebsite.trim() || null
  const portfolioData = mode === 'portfolio' ? (selectedPortfolioCompany || null) : null

  const canGenerate = companyName && (wantSheet || wantPlan)

  // File upload
  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
    e.target.value = ''
  }
  const removeFile = (idx) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))

  // Toggle metric
  const toggleMetric = (key) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Generate
  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setError(null)
    setSheetData(null)
    setPlanData(null)
    setChatContext('')

    const results = []

    try {
      if (wantSheet) {
        let res
        if (uploadedFiles.length > 0) {
          const form = new FormData()
          form.append('company_name', companyName)
          if (companyWebsite) form.append('website', companyWebsite)
          if (portfolioData) form.append('portfolio_data_json', JSON.stringify(portfolioData))
          uploadedFiles.forEach(f => form.append('files', f))
          res = await intelligenceApi.generateCompanySheetWithDocs(form)
        } else {
          res = await intelligenceApi.generateCompanySheet({
            company_name: companyName,
            website: companyWebsite,
            portfolio_data: portfolioData,
          })
        }
        setSheetData(res.data?.data || res.data)
        results.push('Company Sheet generated')
      }

      if (wantPlan) {
        const res = await intelligenceApi.generateBusinessPlan({
          company_name: companyName,
          website: companyWebsite,
          selected_metrics: selectedMetrics,
          portfolio_data: portfolioData,
        })
        setPlanData(res.data?.data || res.data)
        results.push('Business Plan generated')
      }

      // Build chat context from generated data
      setChatContext(results.join('; ') + ` for ${companyName}`)
    } catch (err) {
      setError(`Generation failed: ${err?.response?.data?.detail || err?.message || 'Unknown error'}. Using mock data.`)
      // Fall back to inline mock
      const { generateMockSheet, generateMockPlan } = await import('../data/intelligenceMock')
      if (wantSheet) setSheetData(generateMockSheet(companyName, portfolioData))
      if (wantPlan) setPlanData(generateMockPlan(companyName, selectedMetrics, portfolioData))
      setChatContext(`Mock data for ${companyName}`)
    } finally {
      setGenerating(false)
    }
  }

  const hasResults = sheetData || planData

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Company Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-powered company research — company sheets, business plans and free-form Q&A
          </p>
        </div>
        <SectionBadge label="AI-Powered · Mock Mode" />
      </div>

      {/* ── Step 1: Company selection ─────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Step 1 — Select a Company
        </div>

        {/* Toggle: Portfolio vs New */}
        <div className="flex gap-2">
          {[
            { key: 'portfolio', label: 'Portfolio Company' },
            { key: 'new',       label: 'New Company' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => { setMode(opt.key); setSheetData(null); setPlanData(null) }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                mode === opt.key
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mode === 'portfolio' ? (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Choose from portfolio
            </label>
            <select
              value={selectedCompanyId}
              onChange={e => { setSelectedCompanyId(e.target.value); setSheetData(null); setPlanData(null) }}
              className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Select company —</option>
              {portfolioCompanies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.sector ? `· ${c.sector}` : ''} {c.fund ? `· ${c.fund}` : ''}
                </option>
              ))}
            </select>
            {selectedPortfolioCompany && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {[
                  { label: selectedPortfolioCompany.sector },
                  { label: selectedPortfolioCompany.geography },
                  { label: selectedPortfolioCompany.fund },
                  { label: selectedPortfolioCompany.status },
                ].filter(t => t.label).map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {t.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company name *</label>
              <input
                type="text"
                value={newCompanyName}
                onChange={e => { setNewCompanyName(e.target.value); setSheetData(null); setPlanData(null) }}
                placeholder="e.g. Acme Corporation"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company website <span className="text-gray-400">(optional — used to source data)</span>
              </label>
              <div className="relative">
                <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={newCompanyWebsite}
                  onChange={e => setNewCompanyWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Step 2: Choose outputs ────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-5">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Step 2 — Choose Outputs
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* ── Option A: Company Sheet ── */}
          <div className={`rounded-xl p-4 transition-colors shadow-sm ${wantSheet ? 'bg-blue-50/40 ring-1 ring-brand-500' : 'bg-white'}`}>
            <Checkbox
              checked={wantSheet}
              onChange={setWantSheet}
              label="Company Sheet"
              description="A comprehensive research note covering all key diligence areas"
            />

            {wantSheet && (
              <div className="mt-4 space-y-3 pl-7">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="font-semibold text-gray-700 mb-1">Sections generated:</div>
                  {[
                    'Business overview & description',
                    'Entry financials (PDF / web sourced)',
                    'Company history',
                    'Management team',
                    'SWOT analysis',
                    'Debt & capital structure',
                    'Corporate events',
                    'Projections',
                    'Exit view & exit signals',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-brand-500 flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>

                {/* Document upload */}
                <div className="border-t border-blue-100 pt-3">
                  <div className="text-xs font-medium text-gray-700 mb-1.5">
                    Upload supporting documents <span className="text-gray-400 font-normal">(optional)</span>
                  </div>
                  <InfoBox>
                    Uploaded documents (PDFs, Word files, text files) are extracted and used as
                    additional context for the LLM. Useful for CIMs, annual reports, or management
                    presentations.
                  </InfoBox>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-colors"
                  >
                    <Upload size={12} />
                    Choose files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.csv"
                    className="hidden"
                    onChange={handleFileAdd}
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
                          <FileText size={11} className="text-gray-400" />
                          <span className="flex-1 truncate">{f.name}</span>
                          <span className="text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                          <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Option B: Business Plan ── */}
          <div className={`rounded-xl p-4 transition-colors shadow-sm ${wantPlan ? 'bg-purple-50/40 ring-1 ring-purple-500' : 'bg-white'}`}>
            <Checkbox
              checked={wantPlan}
              onChange={setWantPlan}
              label="Business Plan"
              description="Forward-looking plan with financial projections sourced from the web"
            />

            {wantPlan && (
              <div className="mt-4 space-y-3 pl-7">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="font-semibold text-gray-700 mb-1">Includes:</div>
                  {[
                    'Executive summary',
                    'Market analysis & sizing',
                    'Strategic pillars (3–5 year)',
                    'Financial projections (your choice)',
                    'Risks & mitigants',
                    'Conclusion / returns case',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>

                {/* Metric selection */}
                <div className="border-t border-purple-100 pt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Financial metrics to include in projections
                  </div>
                  <div className="space-y-1.5">
                    {FINANCIAL_METRICS.map(({ key, label, description }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMetric(key)}
                        className="flex items-start gap-2 w-full text-left group"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {selectedMetrics.includes(key)
                            ? <CheckSquare size={13} className="text-purple-500" />
                            : <Square size={13} className="text-gray-400 group-hover:text-gray-600" />}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-800">{label}</span>
                          <span className="text-xs text-gray-400 ml-1">— {description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedMetrics.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={11} /> Select at least one metric
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating || (wantPlan && selectedMetrics.length === 0)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {generating ? (
              <><Loader2 size={15} className="animate-spin" /> Generating…</>
            ) : (
              <><Sparkles size={15} /> Generate</>
            )}
          </button>
          {!companyName && (
            <span className="text-xs text-gray-400">Select a company first</span>
          )}
          {companyName && !wantSheet && !wantPlan && (
            <span className="text-xs text-gray-400">Choose at least one output</span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-red-400" />
            {error}
          </div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      {hasResults && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2">Results</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {sheetData && (
            <div className="panel">
              <CompanySheetResult data={sheetData} companyName={companyName} />
            </div>
          )}

          {planData && (
            <div className="panel">
              <BusinessPlanResult data={planData} companyName={companyName} />
            </div>
          )}
        </div>
      )}

      {/* ── Chat ─────────────────────────────────────────────── */}
      <ChatBox companyName={companyName} contextSummary={chatContext} />
    </div>
  )
}

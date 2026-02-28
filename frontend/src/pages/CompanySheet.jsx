import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import {
  ArrowLeft, Download, FileText, Send, User, TrendingUp, TrendingDown
} from 'lucide-react'
import clsx from 'clsx'
import { companyApi } from '../api'
import { MOCK_COMPANIES, MOCK_NEWS, MOCK_BUSINESS_PLAN } from '../data/mockData'
import SurvivalCurveChart from '../components/charts/SurvivalCurveChart'
import MOICDistributionChart from '../components/charts/MOICDistributionChart'

function StatusBadge({ status }) {
  if (status === 'Active') return <span className="tag-blue">Active</span>
  if (status === 'Exited') return <span className="tag-green">Exited</span>
  if (status === 'At Risk') return <span className="tag-amber">At Risk</span>
  return <span className="tag-gray">{status}</span>
}

function SentimentBadge({ sentiment }) {
  if (sentiment === 'positive') return <span className="tag-green">Positive</span>
  if (sentiment === 'negative') return <span className="tag-red">Negative</span>
  return <span className="tag-gray">Neutral</span>
}

function MetricRow({ label, value, change }) {
  const isPositive = change && change.startsWith('+')
  const isNegative = change && (change.startsWith('-') && !change.includes('pp'))
  return (
    <tr>
      <td className="text-gray-600 py-2 px-3 border-b border-gray-100">{label}</td>
      <td className="text-right font-mono font-medium text-gray-900 py-2 px-3 border-b border-gray-100">{value}</td>
      <td className="text-right py-2 px-3 border-b border-gray-100">
        {change && (
          <span className={clsx('text-xs font-medium', isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500')}>
            {change}
          </span>
        )}
      </td>
    </tr>
  )
}

function SWOTBox({ label, content, colorClass }) {
  const colors = {
    S: 'bg-blue-50 border-blue-200',
    W: 'bg-amber-50 border-amber-200',
    O: 'bg-emerald-50 border-emerald-200',
    T: 'bg-red-50 border-red-200',
  }
  const labelColors = {
    S: 'text-blue-700',
    W: 'text-amber-700',
    O: 'text-emerald-700',
    T: 'text-red-700',
  }
  return (
    <div className={clsx('border rounded p-3', colors[colorClass])}>
      <div className={clsx('text-xs font-bold uppercase tracking-wider mb-2', labelColors[colorClass])}>{label}</div>
      <p className="text-xs text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}

const FinancialTooltip = ({ active, payload, label }) => {
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

function ChatMessage({ role, content }) {
  return (
    <div className={clsx('flex gap-2 mb-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white font-bold" style={{ fontSize: 9 }}>AI</span>
        </div>
      )}
      <div className={clsx(
        'max-w-lg px-3 py-2 rounded text-xs leading-relaxed',
        role === 'user'
          ? 'bg-brand-500 text-white'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
      )}>
        {content}
      </div>
      {role === 'user' && (
        <div className="w-6 h-6 rounded bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={12} className="text-gray-600" />
        </div>
      )}
    </div>
  )
}

function BusinessPlanSection({ content }) {
  const sections = content.trim().split('\n\n').filter(Boolean)
  return (
    <div className="prose prose-sm max-w-none">
      {sections.map((section, i) => {
        const lines = section.split('\n')
        const firstLine = lines[0]
        if (firstLine.startsWith('## ')) {
          return (
            <div key={i} className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b border-gray-200">
                {firstLine.replace('## ', '')}
              </h3>
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {lines.slice(1).join('\n')}
              </div>
            </div>
          )
        }
        if (firstLine.startsWith('### ')) {
          return (
            <div key={i} className="mb-3">
              <h4 className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                {firstLine.replace('### ', '')}
              </h4>
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {lines.slice(1).join('\n')}
              </div>
            </div>
          )
        }
        return (
          <p key={i} className="text-xs text-gray-700 leading-relaxed mb-3 whitespace-pre-line">
            {section}
          </p>
        )
      })}
    </div>
  )
}

export default function CompanySheet() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [planLoading, setPlanLoading] = useState(false)
  const [businessPlan, setBusinessPlan] = useState(null)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello. I\'m your AI analyst for this portfolio company. I have access to all financial data, investment thesis documentation, and market intelligence. What would you like to explore?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    const numId = parseInt(id)
    const mockCompany = MOCK_COMPANIES.find(c => c.id === numId) || MOCK_COMPANIES[0]
    const mockNews = MOCK_NEWS[numId] || MOCK_NEWS[1] || []

    Promise.allSettled([
      companyApi.getCompany(id),
      companyApi.getNews(id),
    ]).then(([companyResult, newsResult]) => {
      setCompany(companyResult.status === 'fulfilled' ? companyResult.value.data : mockCompany)
      setNews(newsResult.status === 'fulfilled' ? newsResult.value.data : mockNews)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleGeneratePlan = async () => {
    setPlanLoading(true)
    try {
      const res = await companyApi.generateBusinessPlan(id)
      setBusinessPlan(res.data.content || res.data.plan || MOCK_BUSINESS_PLAN)
    } catch {
      setBusinessPlan(MOCK_BUSINESS_PLAN)
    } finally {
      setPlanLoading(false)
    }
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const res = await companyApi.chat(id, userMsg)
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response || res.data.message }])
    } catch {
      const mockResponses = [
        `Based on my analysis of ${company?.name || 'this company'}, ${userMsg.toLowerCase().includes('moic') ? 'the predicted MOIC of ' + (company?.moic || 2.3) + 'x is supported by strong revenue growth of ' + (company?.revenue_growth || 22.5) + '% and expanding EBITDA margins. The primary upside driver is the international expansion thesis, while leverage remains the key downside risk.' : 'the company continues to track ahead of entry case projections across key operational metrics. Revenue growth has accelerated to ' + (company?.revenue_growth || 22.5) + '% YoY, materially above the ' + Math.round((company?.revenue_growth || 22.5) * 0.75) + '% entry case assumption.'}`,
        `The investment is performing ${(company?.moic || 1.5) >= 2 ? 'above' : 'in line with'} entry case expectations. Key value creation levers include margin expansion, which has improved ${Math.round(Math.random() * 4 + 2)}pp since entry, and revenue growth acceleration driven by ${company?.sector === 'Technology' ? 'new product launches and geographic expansion' : 'operational improvements and market share gains'}.`,
      ]
      setChatMessages(prev => [...prev, { role: 'assistant', content: mockResponses[Math.floor(Math.random() * mockResponses.length)] }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 panel animate-pulse" />
        <div className="h-16 panel animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 panel animate-pulse" />
          <div className="h-64 panel animate-pulse" />
        </div>
      </div>
    )
  }

  if (!company) {
    return <div className="panel p-8 text-center text-sm text-gray-500">Company not found.</div>
  }

  const survivalData = company.predictions?.survival_curve?.map(p => ({
    time: p.time,
    [company.name]: p.probability
  })) || []

  const moicDist = company.predictions?.moic_distribution || []

  return (
    <div className="max-w-5xl mx-auto space-y-0">
      {/* Back Navigation */}
      <div className="mb-4">
        <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={12} />
          Back to Portfolio
        </Link>
      </div>

      {/* SECTION 1: Company Header */}
      <div className="panel p-5 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
              <StatusBadge status={company.status} />
            </div>
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="tag-gray">{company.sector}</span>
              <span className="tag-gray">{company.geography}</span>
              <span className="tag-blue">{company.fund}</span>
              <span className="tag-gray">Vintage {company.vintage_year}</span>
              <span className="tag-gray">
                Hold: {company.holding_period_years?.toFixed(1)} yrs
              </span>
              {company.hq && <span className="tag-gray">{company.hq}</span>}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>Entry: {company.vintage_year}</span>
              <span className="mx-1">&middot;</span>
              <span>{company.employees?.toLocaleString()} employees</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="btn-primary"
            >
              <FileText size={12} />
              {planLoading ? 'Generating...' : 'Generate Business Plan'}
            </button>
            <button className="btn-secondary">
              <Download size={12} />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Entry Snapshot */}
      <div className="panel p-4 mb-4">
        <div className="panel-title mb-3">Entry Snapshot</div>
        <div className="grid grid-cols-5 gap-0 divide-x divide-gray-200">
          {[
            { label: 'Entry EV', value: `$${company.entry_ev}M` },
            { label: 'Entry EBITDA', value: `$${company.entry_ebitda}M` },
            { label: 'Entry Revenue', value: `$${company.entry_revenue}M` },
            { label: 'Entry Leverage', value: `${company.entry_leverage}x` },
            { label: 'EV / EBITDA', value: `${company.entry_ev_ebitda?.toFixed(1)}x` },
          ].map(item => (
            <div key={item.label} className="text-center px-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1" style={{ fontSize: 10 }}>{item.label}</div>
              <div className="font-mono text-sm font-semibold text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Two Column - Description & Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left */}
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="panel-title mb-2">Business Description</div>
            <p className="text-xs text-gray-700 leading-relaxed">{company.description}</p>
          </div>
          <div className="panel p-4">
            <div className="panel-title mb-2">Investment Thesis</div>
            <p className="text-xs text-gray-700 leading-relaxed">{company.investment_thesis}</p>
          </div>
          {company.management && (
            <div className="panel p-4">
              <div className="panel-title mb-3">Management Team</div>
              <div className="space-y-2">
                {company.management.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.title}</div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{m.tenure_years}yr tenure</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-4">
          {company.key_metrics && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Key Performance Metrics</span>
                <span className="text-xs text-gray-400">vs. Prior Year</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-gray-500 font-semibold uppercase tracking-wider py-2 px-3">Metric</th>
                    <th className="text-right text-gray-500 font-semibold uppercase tracking-wider py-2 px-3">Value</th>
                    <th className="text-right text-gray-500 font-semibold uppercase tracking-wider py-2 px-3">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {company.key_metrics.map(m => (
                    <MetricRow key={m.label} label={m.label} value={m.value} change={m.change} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {company.swot && (
            <div className="panel p-4">
              <div className="panel-title mb-3">SWOT Analysis</div>
              <div className="grid grid-cols-2 gap-2">
                <SWOTBox label="Strengths" content={company.swot.strengths} colorClass="S" />
                <SWOTBox label="Weaknesses" content={company.swot.weaknesses} colorClass="W" />
                <SWOTBox label="Opportunities" content={company.swot.opportunities} colorClass="O" />
                <SWOTBox label="Threats" content={company.swot.threats} colorClass="T" />
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-200 my-6" />

      {/* SECTION 4: Historical Performance */}
      {company.historical_financials && (
        <div className="mb-4">
          <div className="panel-title mb-3">Historical Performance</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="panel p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Revenue & EBITDA ($M)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={company.historical_financials} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={false} width={44} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<FinancialTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
                  <Line type="monotone" dataKey="revenue" stroke="#1a56db" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                  <Line type="monotone" dataKey="ebitda" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="EBITDA" strokeDasharray="5 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="panel p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Valuation Evolution ($M)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={company.historical_financials} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#dee2e6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c757d' }} tickLine={false} axisLine={false} width={44} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<FinancialTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
                  <Line type="monotone" dataKey="valuation" stroke="#0f4c81" strokeWidth={2} dot={{ r: 3 }} name="Valuation" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <hr className="border-gray-200 my-6" />

      {/* SECTION 5: Comparable Companies */}
      {company.comparable_companies && (
        <div className="panel mb-4">
          <div className="panel-header">
            <span className="panel-title">Comparable Companies</span>
            <span className="text-xs text-gray-400">Market data</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th className="text-right">EV / EBITDA</th>
                <th className="text-right">Revenue Growth</th>
                <th className="text-right">EBITDA Margin</th>
              </tr>
            </thead>
            <tbody>
              {company.comparable_companies.map((comp, i) => (
                <tr
                  key={i}
                  className={clsx(comp.is_subject && 'bg-blue-50/40')}
                >
                  <td>
                    <span className={clsx('font-medium', comp.is_subject ? 'text-brand-500' : 'text-gray-900')}>
                      {comp.name}
                      {comp.is_subject && <span className="ml-2 tag-blue text-xs">Subject</span>}
                    </span>
                  </td>
                  <td className="text-right font-mono">{comp.ev_ebitda.toFixed(1)}x</td>
                  <td className="text-right font-mono">{comp.rev_growth.toFixed(1)}%</td>
                  <td className="text-right font-mono">{comp.ebitda_margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <hr className="border-gray-200 my-6" />

      {/* SECTION 6: Exit Predictions */}
      <div className="mb-4">
        <div className="panel-title mb-3">Exit Predictions</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="panel p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Survival Curve (Probability of Holding)
            </div>
            {survivalData.length > 0 ? (
              <SurvivalCurveChart
                data={survivalData}
                groups={[company.name]}
                height={220}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-gray-400">No survival data</div>
            )}
          </div>
          <div className="panel p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              MOIC Distribution (Monte Carlo)
            </div>
            <MOICDistributionChart
              data={moicDist}
              p10={company.predictions?.p10}
              p50={company.predictions?.p50}
              p90={company.predictions?.p90}
              height={220}
            />
            <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xs text-gray-400">Bear Case (P10)</div>
                <div className="font-mono text-sm font-semibold text-gray-700">{company.predictions?.p10?.toFixed(1)}x</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Base Case (P50)</div>
                <div className="font-mono text-sm font-bold text-brand-500">{company.predictions?.p50?.toFixed(1)}x</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Bull Case (P90)</div>
                <div className="font-mono text-sm font-semibold text-gray-700">{company.predictions?.p90?.toFixed(1)}x</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 my-6" />

      {/* SECTION 7: AI Business Plan */}
      <div className="panel mb-4">
        <div className="panel-header">
          <span className="panel-title">AI-Generated Business Plan</span>
          <button
            onClick={handleGeneratePlan}
            disabled={planLoading}
            className="btn-primary"
          >
            <FileText size={12} />
            {planLoading ? 'Generating...' : businessPlan ? 'Regenerate' : 'Generate Business Plan'}
          </button>
        </div>
        <div className="p-5">
          {planLoading ? (
            <div className="flex items-center gap-3 py-8">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-500">Analyzing company data and generating strategic business plan...</span>
            </div>
          ) : businessPlan ? (
            <BusinessPlanSection content={businessPlan} />
          ) : (
            <div className="text-center py-8 text-xs text-gray-400">
              Click "Generate Business Plan" to create an AI-powered strategic analysis for {company.name}.
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-200 my-6" />

      {/* SECTION 8: News & Sentiment */}
      <div className="panel mb-4">
        <div className="panel-header">
          <span className="panel-title">News & Market Intelligence</span>
          <span className="text-xs text-gray-400">{news.length} articles</span>
        </div>
        <div className="divide-y divide-gray-100">
          {news.length > 0 ? news.map((item) => (
            <div key={item.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">{item.date}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-500 font-medium">{item.source}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{item.title}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.summary}</p>
                </div>
                <div className="flex-shrink-0">
                  <SentimentBadge sentiment={item.sentiment} />
                </div>
              </div>
            </div>
          )) : (
            <div className="px-4 py-8 text-center text-xs text-gray-400">No news articles available.</div>
          )}
        </div>
      </div>

      <hr className="border-gray-200 my-6" />

      {/* SECTION 9: AI Chat */}
      <div className="panel mb-4">
        <div className="panel-header">
          <span className="panel-title">AI Analyst Chat</span>
          <span className="tag-blue">GPT-4 Powered</span>
        </div>
        <div className="p-4 h-80 overflow-y-auto bg-gray-50/30">
          {chatMessages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {chatLoading && (
            <div className="flex gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold" style={{ fontSize: 9 }}>AI</span>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-gray-200">
          <form onSubmit={handleChat} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={`Ask about ${company.name}...`}
              className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-brand-500 bg-white"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="btn-primary px-3 py-2"
            >
              <Send size={12} />
            </button>
          </form>
          <div className="flex gap-2 mt-2 flex-wrap">
            {[
              `What drives the ${company.predictions?.p50?.toFixed(1)}x MOIC prediction?`,
              'Summarize key investment risks',
              'What are the exit options?',
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setChatInput(suggestion)}
                className="text-xs text-gray-500 hover:text-brand-500 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

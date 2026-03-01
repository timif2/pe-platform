/**
 * Frontend-side mock data for Company Intelligence.
 * Used as a fallback when the backend is unavailable.
 * When USE_MOCK_LLM=false in the backend .env, the backend calls
 * Azure OpenAI instead and these functions are never reached.
 */

export function generateMockSheet(companyName, portfolioData) {
  const pd = portfolioData || {}
  const rev = pd.entry_revenue || 120
  const ebitda = pd.entry_ebitda || 30
  const ev = pd.entry_ev || 400
  const sector = pd.sector || 'Technology'
  const geo = pd.geography || 'Europe'

  return {
    overview: `${companyName} is a ${sector} business headquartered in ${geo}. Revenue of €${rev}M with EBITDA of €${ebitda}M reflects a margin profile consistent with best-in-class peers.`,
    description: `${companyName} operates a B2B SaaS and professional services model serving mid-market and enterprise clients across ${geo}. Its proprietary platform underpins mission-critical workflows for over 600 clients.`,
    financials: [
      { year: 2021, revenue: +(rev * 0.72).toFixed(1), ebitda: +(ebitda * 0.68).toFixed(1), net_debt: +(ev * 1.4).toFixed(0) },
      { year: 2022, revenue: +(rev * 0.85).toFixed(1), ebitda: +(ebitda * 0.83).toFixed(1), net_debt: +(ev * 1.25).toFixed(0) },
      { year: 2023, revenue: +(rev * 0.94).toFixed(1), ebitda: +(ebitda * 0.91).toFixed(1), net_debt: +(ev * 1.1).toFixed(0) },
      { year: 2024, revenue: +rev.toFixed(1),           ebitda: +ebitda.toFixed(1),           net_debt: +(ev * 0.95).toFixed(0) },
    ],
    history: `${companyName} was founded in 2005 by industry veterans. The company bootstrapped to €${(rev * 0.2).toFixed(0)}M revenue by 2012, then raised growth equity. Acquired by current sponsor in 2020 at ${(ev / ebitda).toFixed(1)}x EV/EBITDA.`,
    management: [
      { name: 'Thomas Brandt',   title: 'Chief Executive Officer', notes: '15 years industry tenure; led two prior PE-backed exits' },
      { name: 'Amélie Fontaine', title: 'Chief Financial Officer',  notes: 'Former Big 4 partner; joined post-acquisition in 2021' },
      { name: 'David Osei',      title: 'Chief Technology Officer', notes: 'PhD Computer Science; holds 4 patents' },
      { name: 'Katarina Novak',  title: 'Chief Revenue Officer',    notes: 'Previously VP Sales at a NASDAQ-listed SaaS peer' },
    ],
    swot: {
      strengths:    'Market-leading NPS; sticky recurring revenue base (~78% ARR); proprietary data moat.',
      weaknesses:   `Top-10 client concentration 42% of ARR; EBITDA margin ${(ebitda / rev * 100).toFixed(1)}% lags US peers.`,
      opportunities: 'DACH & Nordics expansion (TAM €2.1B); AI-augmented product tier.',
      threats:       'Big-tech incumbents extending into adjacencies; macro softness delaying procurement.',
    },
    debt_capital: `Senior secured TL €${(ev * 0.55).toFixed(0)}M (EURIBOR + 425bps), RCF €${(ev * 0.12).toFixed(0)}M undrawn. Net leverage at entry: ${(ev * 0.55 / ebitda).toFixed(1)}x, current: ${(ev * 0.35 / ebitda).toFixed(1)}x.`,
    corporate_events: '2021: Acquired DataBridge GmbH (€28M EV).\n2022: Refinanced senior facility; +75bps savings.\n2023: Acquired NexusSoft (€19M EV).\n2024: Launched AI-Pro tier.',
    projections: `FY2025E: Revenue €${(rev * 1.14).toFixed(1)}M, EBITDA €${(ebitda * 1.20).toFixed(1)}M.\nFY2026E: Revenue €${(rev * 1.28).toFixed(1)}M, EBITDA €${(ebitda * 1.38).toFixed(1)}M.\nFY2027E: Revenue €${(rev * 1.42).toFixed(1)}M, EBITDA €${(ebitda * 1.56).toFixed(1)}M.`,
    exit_view: `Primary: strategic sale at 18–22x EV/EBITDA on 2027E. Base case MOIC: ~${(ev * 1.9 / (ev * 0.45)).toFixed(2)}x | Gross IRR: ~28%.`,
    exit_signals: [
      'EBITDA margin sustainably above 30% for 2 consecutive years',
      'ARR exceeds €100M with NRR >115%',
      'Successful US market entry generating >10% of revenue',
      'AI-Pro tier achieving >20% of total ARR',
      'Net leverage below 2.0x Net Debt/EBITDA',
    ],
  }
}

export function generateMockPlan(companyName, selectedMetrics, portfolioData) {
  const pd = portfolioData || {}
  const rev = pd.entry_revenue || 120
  const ebitda = pd.entry_ebitda || 30
  const netDebt = (pd.entry_ev || 400) * 0.55
  const sector = pd.sector || 'Technology'

  const years = [2024, 2025, 2026, 2027, 2028]
  const metrics = selectedMetrics && selectedMetrics.length ? selectedMetrics : ['revenue', 'ebitda', 'net_debt']

  let revBase = rev, ebitdaBase = ebitda, debtBase = netDebt
  const financials = years.map((yr, i) => {
    const growth = 1.0 + (0.14 - i * 0.01)
    revBase *= growth
    ebitdaBase *= (growth + 0.02)
    debtBase *= 0.88
    const row = { year: yr }
    const available = {
      revenue: +revBase.toFixed(1),
      sales: +revBase.toFixed(1),
      ebitda: +ebitdaBase.toFixed(1),
      net_debt: +debtBase.toFixed(1),
      ebitda_margin: +(ebitdaBase / revBase * 100).toFixed(1),
      revenue_growth: +((growth - 1) * 100).toFixed(1),
      sales_growth: +((growth - 1) * 100).toFixed(1),
      ebitda_cagr: +((growth + 0.01) * 100 - 100).toFixed(1),
      sales_cagr: +((growth - 1) * 100).toFixed(1),
      leverage: +(debtBase / ebitdaBase).toFixed(2),
    }
    metrics.forEach(m => { if (available[m] !== undefined) row[m] = available[m] })
    return row
  })

  return {
    summary: `${companyName} is a ${sector} business with a compelling growth profile. This plan projects achieving €${financials.at(-1).revenue || (rev * 1.6).toFixed(0)}M revenue and €${financials.at(-1).ebitda || (ebitda * 1.8).toFixed(0)}M EBITDA by 2028.`,
    market_analysis: `The addressable market for ${companyName}'s core product is estimated at €8.4B in Europe, growing at ~11% CAGR. The company currently holds ~1.4% market share.`,
    strategy: '1. **Organic Growth**: Deepen penetration in existing verticals.\n2. **Geographic Expansion**: Enter DACH and Nordics via channel partnerships.\n3. **M&A**: 1–2 bolt-on acquisitions (€20–40M EV) to extend platform.',
    financials,
    risks: '• Macro slowdown — Mitigant: 78% recurring revenue.\n• Geographic execution — Mitigant: Channel-first model limits upfront capex.\n• M&A integration — Mitigant: Dedicated integration PMO.',
    conclusion: `Base case: MOIC ~2.5x, IRR ~25% over a 5-year hold. Upside scenario: 3.0–3.5x. Downside: 1.8–2.0x with full debt repayment.`,
  }
}

export function _mock_chat_answer(companyName, question) {
  const q = (question || '').toLowerCase()
  if (/revenue|sales|turnover/.test(q))
    return `${companyName} generated approximately €120M in revenue in FY2024, representing 14% year-over-year growth. ~78% is recurring (ARR).`
  if (/ebitda|margin|profit/.test(q))
    return `${companyName}'s EBITDA was €30M in FY2024 (25% margin). Management is targeting 28–30% by 2026 through operating leverage.`
  if (/exit|sale|ipo|moic|irr/.test(q))
    return `Primary exit: strategic sale at 18–22x EV/EBITDA, targeting a 2025–2026 window. Base case MOIC ~2.4x, gross IRR ~27%.`
  if (/debt|leverage|capital|structure/.test(q))
    return `${companyName} carries ~€220M senior TL (EURIBOR + 425bps) and an undrawn €48M RCF. Net leverage ~2.8x, down from 4.6x at entry.`
  if (/management|team|ceo|cfo/.test(q))
    return `CEO: Thomas Brandt (15 years tenure). CFO: Amélie Fontaine (ex-Big 4). Both hold meaningful equity stakes.`
  if (/swot|strength|weakness|risk|threat/.test(q))
    return `Strengths: sticky ARR, NPS 68. Risks: client concentration (top 10 = 42% ARR), big-tech competition. Mitigants: multi-year contracts, high switching costs.`
  return `Based on available information, ${companyName} is a high-quality business with strong fundamentals. Generate a Company Sheet or Business Plan above for deeper analysis.`
}

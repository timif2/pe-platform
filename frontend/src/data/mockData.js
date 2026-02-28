// ============================================================
// MOCK DATA FOR PE ANALYTICS PLATFORM
// Used as fallback when API is unavailable
// ============================================================

export const MOCK_COMPANIES = [
  {
    id: 1,
    name: 'NovaTech Systems',
    sector: 'Technology',
    geography: 'North America',
    fund: 'Fund III',
    fund_id: 3,
    status: 'Active',
    vintage_year: 2020,
    holding_period_years: 3.5,
    entry_ev: 320,
    entry_ebitda: 28,
    entry_revenue: 95,
    entry_leverage: 4.8,
    entry_ev_ebitda: 11.4,
    current_nav: 510,
    moic: 2.3,
    irr: 28.4,
    revenue_growth: 22.5,
    ebitda_margin: 31.2,
    employees: 850,
    hq: 'San Francisco, CA',
    description: 'NovaTech Systems is a leading provider of enterprise software solutions for supply chain optimization and logistics management. The company serves over 400 enterprise clients across North America and Europe, with a strong recurring revenue model and best-in-class net revenue retention of 118%.',
    investment_thesis: 'Acquired NovaTech to capitalize on the secular shift toward digital supply chain transformation. The business exhibits strong competitive moats through deep ERP integrations, high switching costs, and a network of 2,400+ certified implementation partners. The investment thesis centers on international expansion (entering EU markets), product portfolio extension into AI-driven demand forecasting, and margin improvement through operational efficiency.',
    management: [
      { name: 'James Harrington', title: 'Chief Executive Officer', tenure_years: 6 },
      { name: 'Sarah Chen', title: 'Chief Financial Officer', tenure_years: 4 },
      { name: 'Mark Okonkwo', title: 'Chief Technology Officer', tenure_years: 5 },
      { name: 'Lisa Patel', title: 'Chief Revenue Officer', tenure_years: 2 },
    ],
    swot: {
      strengths: 'Market-leading NRR of 118%; Deep ERP integrations create high switching costs; Established partner ecosystem with 2,400+ certified partners; Strong management team with proven track record',
      weaknesses: 'Concentration risk: top 10 clients represent 38% of ARR; Product roadmap execution risk following CTO transition; Below-peer EBITDA margins due to elevated R&D spend',
      opportunities: 'EU market expansion (TAM $4.2B); AI/ML product extensions; M&A of complementary point solutions; Cross-sell into existing base',
      threats: 'Oracle and SAP developing competing native modules; Macro slowdown could delay enterprise IT budgets; Key person risk around CEO',
    },
    key_metrics: [
      { label: 'ARR', value: '$87M', change: '+24%' },
      { label: 'NRR', value: '118%', change: '+3pp' },
      { label: 'Gross Margin', value: '74%', change: '+1pp' },
      { label: 'EBITDA Margin', value: '31%', change: '+4pp' },
      { label: 'Churn Rate', value: '2.1%', change: '-0.4pp' },
      { label: 'CAC Payback', value: '14 months', change: '-2 months' },
    ],
    comparable_companies: [
      { name: 'Manhattan Associates', ev_ebitda: 48.2, rev_growth: 14.2, ebitda_margin: 29.1, is_subject: false },
      { name: 'Blue Yonder (JDA)', ev_ebitda: 22.5, rev_growth: 18.7, ebitda_margin: 24.3, is_subject: false },
      { name: 'E2open', ev_ebitda: 19.8, rev_growth: 11.4, ebitda_margin: 22.8, is_subject: false },
      { name: 'Kinaxis', ev_ebitda: 41.3, rev_growth: 20.1, ebitda_margin: 26.4, is_subject: false },
      { name: 'NovaTech Systems', ev_ebitda: 18.3, rev_growth: 22.5, ebitda_margin: 31.2, is_subject: true },
    ],
    historical_financials: [
      { year: 2019, revenue: 62, ebitda: 14, valuation: 280 },
      { year: 2020, revenue: 78, ebitda: 18, valuation: 320 },
      { year: 2021, revenue: 97, ebitda: 24, valuation: 380 },
      { year: 2022, revenue: 118, ebitda: 31, valuation: 430 },
      { year: 2023, revenue: 144, ebitda: 45, valuation: 510 },
    ],
    predictions: {
      survival_curve: [
        { time: 0, probability: 1.0 },
        { time: 1, probability: 0.92 },
        { time: 2, probability: 0.81 },
        { time: 3, probability: 0.68 },
        { time: 4, probability: 0.54 },
        { time: 5, probability: 0.41 },
        { time: 6, probability: 0.30 },
        { time: 7, probability: 0.21 },
        { time: 8, probability: 0.14 },
      ],
      moic_distribution: [
        { moic: 0.5, frequency: 2 },
        { moic: 1.0, frequency: 8 },
        { moic: 1.5, frequency: 18 },
        { moic: 2.0, frequency: 32 },
        { moic: 2.5, frequency: 24 },
        { moic: 3.0, frequency: 10 },
        { moic: 3.5, frequency: 4 },
        { moic: 4.0, frequency: 2 },
      ],
      p10: 1.4,
      p50: 2.3,
      p90: 3.6,
    },
  },
  {
    id: 2,
    name: 'Pinnacle Health Partners',
    sector: 'Healthcare',
    geography: 'North America',
    fund: 'Fund II',
    fund_id: 2,
    status: 'Active',
    vintage_year: 2018,
    holding_period_years: 5.8,
    entry_ev: 180,
    entry_ebitda: 22,
    entry_revenue: 68,
    entry_leverage: 5.2,
    entry_ev_ebitda: 8.2,
    current_nav: 290,
    moic: 1.9,
    irr: 16.8,
    revenue_growth: 12.4,
    ebitda_margin: 26.8,
    employees: 1240,
    hq: 'Nashville, TN',
    description: 'Pinnacle Health Partners operates a network of 47 ambulatory surgical centers and specialty clinics across 12 states. The company focuses on high-acuity, elective procedures in orthopedics, ophthalmology, and GI, providing high-quality care at lower cost compared to hospital settings.',
    investment_thesis: 'The investment thesis is predicated on the structural shift of surgical volumes from inpatient hospital settings to lower-cost outpatient ASC environments, driven by payer mandates and technological advances enabling more complex procedures outpatient. Value creation levers include de novo site development (8 new sites planned), payer mix optimization toward commercial insurers, and operational efficiency through centralized revenue cycle management.',
    management: [
      { name: 'Robert Ashby', title: 'Chief Executive Officer', tenure_years: 8 },
      { name: 'Amanda Torres', title: 'Chief Financial Officer', tenure_years: 3 },
      { name: 'Dr. Kevin Walsh', title: 'Chief Medical Officer', tenure_years: 6 },
    ],
    swot: {
      strengths: 'Diversified payer mix across 12 states; Proven de novo development playbook; Strong physician partnership model; Regulatory barriers to entry in existing markets',
      weaknesses: 'Labor cost inflation pressure (nursing shortage); Reimbursement rate uncertainty from CMS; Geographic concentration in Sun Belt markets; Leverage ratio elevated at 5.2x',
      opportunities: 'De novo expansion into underserved markets; ASC conversion of hospital-owned facilities; Ancillary revenue streams (PT, imaging); Orthopedics volume shift from inpatient',
      threats: 'CMS reimbursement cuts for ASC procedures; Hospital system consolidation limiting referral networks; Staffing shortages limiting capacity',
    },
    key_metrics: [
      { label: 'Active Sites', value: '47', change: '+8' },
      { label: 'Cases per Day', value: '124', change: '+12%' },
      { label: 'Revenue per Case', value: '$3,840', change: '+6%' },
      { label: 'EBITDA Margin', value: '26.8%', change: '+2pp' },
      { label: 'Payer Mix (Comm.)', value: '68%', change: '+3pp' },
      { label: 'Physician Retention', value: '96%', change: '+1pp' },
    ],
    comparable_companies: [
      { name: 'USPI (Tenet)', ev_ebitda: 14.2, rev_growth: 8.4, ebitda_margin: 28.1, is_subject: false },
      { name: 'SurgCenter Development', ev_ebitda: 12.8, rev_growth: 15.2, ebitda_margin: 24.3, is_subject: false },
      { name: 'Envision Healthcare', ev_ebitda: 10.1, rev_growth: 6.8, ebitda_margin: 22.1, is_subject: false },
      { name: 'Pinnacle Health Partners', ev_ebitda: 10.8, rev_growth: 12.4, ebitda_margin: 26.8, is_subject: true },
    ],
    historical_financials: [
      { year: 2018, revenue: 68, ebitda: 15, valuation: 180 },
      { year: 2019, revenue: 78, ebitda: 18, valuation: 200 },
      { year: 2020, revenue: 72, ebitda: 14, valuation: 180 },
      { year: 2021, revenue: 94, ebitda: 22, valuation: 230 },
      { year: 2022, revenue: 112, ebitda: 28, valuation: 265 },
      { year: 2023, revenue: 128, ebitda: 34, valuation: 290 },
    ],
    predictions: {
      survival_curve: [
        { time: 0, probability: 1.0 },
        { time: 1, probability: 0.88 },
        { time: 2, probability: 0.74 },
        { time: 3, probability: 0.59 },
        { time: 4, probability: 0.44 },
        { time: 5, probability: 0.32 },
        { time: 6, probability: 0.22 },
        { time: 7, probability: 0.14 },
        { time: 8, probability: 0.08 },
      ],
      moic_distribution: [
        { moic: 0.5, frequency: 4 },
        { moic: 1.0, frequency: 12 },
        { moic: 1.5, frequency: 28 },
        { moic: 2.0, frequency: 30 },
        { moic: 2.5, frequency: 18 },
        { moic: 3.0, frequency: 6 },
        { moic: 3.5, frequency: 2 },
      ],
      p10: 1.1,
      p50: 1.9,
      p90: 2.9,
    },
  },
  {
    id: 3,
    name: 'Meridian Industrials Group',
    sector: 'Industrials',
    geography: 'Europe',
    fund: 'Fund II',
    fund_id: 2,
    status: 'Exited',
    vintage_year: 2016,
    holding_period_years: 5.2,
    entry_ev: 240,
    entry_ebitda: 30,
    entry_revenue: 142,
    entry_leverage: 4.2,
    entry_ev_ebitda: 8.0,
    current_nav: 480,
    moic: 2.8,
    irr: 22.4,
    revenue_growth: 8.2,
    ebitda_margin: 22.4,
    employees: 2100,
    hq: 'Frankfurt, Germany',
    description: 'Meridian Industrials Group is a specialty manufacturer of precision engineered components for automotive and aerospace applications. The company operates 8 manufacturing facilities across Germany, Poland, and the Czech Republic, serving Tier 1 automotive suppliers and aerospace OEMs.',
    investment_thesis: 'Successfully exited via strategic sale to Voith GmbH at 12.4x EBITDA (March 2021). Value creation delivered through footprint optimization (closed 2 underperforming plants), operational excellence program that improved EBITDA margins by 7.4pp, and bolt-on acquisition of Czech precision machining business.',
    management: [
      { name: 'Hans-Dieter Müller', title: 'Chief Executive Officer', tenure_years: 9 },
      { name: 'Ingrid Hofmann', title: 'Chief Financial Officer', tenure_years: 5 },
    ],
    swot: {
      strengths: 'Tier 1 automotive customer relationships; Specialized precision manufacturing capabilities; Low-cost Eastern European production base; ISO/IATF certified facilities',
      weaknesses: 'Cyclical exposure to automotive production volumes; Customer concentration: BMW/VW group >45% revenue; Raw material cost pass-through mechanism limited',
      opportunities: 'EV drivetrain component demand; Aerospace recovery post-COVID; Footprint optimization',
      threats: 'Automotive OEM insourcing trends; EV transition reducing ICE component demand long-term',
    },
    key_metrics: [
      { label: 'Revenue', value: '€182M', change: '+8%' },
      { label: 'EBITDA', value: '€41M', change: '+12%' },
      { label: 'EBITDA Margin', value: '22.4%', change: '+2pp' },
      { label: 'Net Leverage', value: '1.8x', change: '-2.4x' },
      { label: 'OTD Rate', value: '98.4%', change: '+1pp' },
      { label: 'Scrap Rate', value: '0.42%', change: '-0.1pp' },
    ],
    comparable_companies: [
      { name: 'Precision Castparts', ev_ebitda: 16.2, rev_growth: 5.4, ebitda_margin: 26.1, is_subject: false },
      { name: 'GKN Aerospace', ev_ebitda: 11.8, rev_growth: 7.2, ebitda_margin: 19.3, is_subject: false },
      { name: 'Meridian Industrials', ev_ebitda: 12.4, rev_growth: 8.2, ebitda_margin: 22.4, is_subject: true },
    ],
    historical_financials: [
      { year: 2016, revenue: 142, ebitda: 21, valuation: 240 },
      { year: 2017, revenue: 156, ebitda: 25, valuation: 280 },
      { year: 2018, revenue: 168, ebitda: 30, valuation: 340 },
      { year: 2019, revenue: 162, ebitda: 27, valuation: 310 },
      { year: 2020, revenue: 148, ebitda: 22, valuation: 290 },
      { year: 2021, revenue: 182, ebitda: 41, valuation: 480 },
    ],
    predictions: {
      survival_curve: [
        { time: 0, probability: 1.0 },
        { time: 1, probability: 0.95 },
        { time: 2, probability: 0.0 },
      ],
      moic_distribution: [
        { moic: 1.5, frequency: 4 },
        { moic: 2.0, frequency: 10 },
        { moic: 2.5, frequency: 22 },
        { moic: 3.0, frequency: 28 },
        { moic: 3.5, frequency: 18 },
        { moic: 4.0, frequency: 8 },
      ],
      p10: 1.8,
      p50: 2.8,
      p90: 4.1,
    },
  },
  {
    id: 4,
    name: 'Clearwater Consumer Brands',
    sector: 'Consumer',
    geography: 'North America',
    fund: 'Fund III',
    fund_id: 3,
    status: 'Active',
    vintage_year: 2021,
    holding_period_years: 2.8,
    entry_ev: 420,
    entry_ebitda: 48,
    entry_revenue: 210,
    entry_leverage: 5.5,
    entry_ev_ebitda: 8.8,
    current_nav: 440,
    moic: 1.2,
    irr: 7.1,
    revenue_growth: 4.8,
    ebitda_margin: 18.4,
    employees: 3200,
    hq: 'Chicago, IL',
    description: 'Clearwater Consumer Brands is a portfolio of premium household and personal care brands distributed through mass retail, club, and DTC channels. The portfolio includes four owned brands with combined retail sales exceeding $800M across 38,000 retail doors in North America.',
    investment_thesis: 'Thesis predicated on premiumization of household care category and DTC channel build. Macro headwinds from consumer trade-down and elevated input costs have pressured margins. Current focus on stabilizing core brands, reducing SKU complexity, and rebuilding EBITDA margins through pricing and cost discipline.',
    management: [
      { name: 'Michael Brady', title: 'Chief Executive Officer', tenure_years: 2 },
      { name: 'Jennifer Wu', title: 'Chief Financial Officer', tenure_years: 2 },
      { name: 'Carlos Mendez', title: 'Chief Marketing Officer', tenure_years: 1 },
    ],
    swot: {
      strengths: 'Established brand recognition in core categories; Strong retailer relationships across major channels; Proprietary formulations with patent protection',
      weaknesses: 'Margin compression from input cost inflation; Elevated leverage limiting investment capacity; Weak DTC channel execution below plan; Management turnover impacting culture',
      opportunities: 'Private label competition remains limited in premium tier; Club channel expansion; International licensing',
      threats: 'Consumer trade-down to private label; Continued input cost volatility; Retail shelf space competition intensifying',
    },
    key_metrics: [
      { label: 'Revenue', value: '$225M', change: '+4.8%' },
      { label: 'EBITDA', value: '$41M', change: '-8%' },
      { label: 'EBITDA Margin', value: '18.4%', change: '-2.8pp' },
      { label: 'Net Leverage', value: '5.1x', change: '+0.3x' },
      { label: 'Market Share', value: '8.2%', change: '-0.4pp' },
      { label: 'DTC Revenue', value: '$18M', change: '+22%' },
    ],
    comparable_companies: [
      { name: 'Church & Dwight', ev_ebitda: 18.4, rev_growth: 8.2, ebitda_margin: 24.2, is_subject: false },
      { name: 'Spectrum Brands', ev_ebitda: 9.8, rev_growth: 3.2, ebitda_margin: 18.1, is_subject: false },
      { name: 'Energizer Holdings', ev_ebitda: 8.9, rev_growth: 2.8, ebitda_margin: 19.4, is_subject: false },
      { name: 'Clearwater Consumer', ev_ebitda: 9.2, rev_growth: 4.8, ebitda_margin: 18.4, is_subject: true },
    ],
    historical_financials: [
      { year: 2021, revenue: 210, ebitda: 48, valuation: 420 },
      { year: 2022, revenue: 218, ebitda: 44, valuation: 410 },
      { year: 2023, revenue: 225, ebitda: 41, valuation: 440 },
    ],
    predictions: {
      survival_curve: [
        { time: 0, probability: 1.0 },
        { time: 1, probability: 0.85 },
        { time: 2, probability: 0.70 },
        { time: 3, probability: 0.55 },
        { time: 4, probability: 0.40 },
        { time: 5, probability: 0.27 },
        { time: 6, probability: 0.17 },
      ],
      moic_distribution: [
        { moic: 0.5, frequency: 8 },
        { moic: 1.0, frequency: 24 },
        { moic: 1.5, frequency: 34 },
        { moic: 2.0, frequency: 22 },
        { moic: 2.5, frequency: 8 },
        { moic: 3.0, frequency: 4 },
      ],
      p10: 0.8,
      p50: 1.5,
      p90: 2.4,
    },
  },
  {
    id: 5,
    name: 'Apex Financial Services',
    sector: 'Financial Services',
    geography: 'Europe',
    fund: 'Fund I',
    fund_id: 1,
    status: 'Exited',
    vintage_year: 2014,
    holding_period_years: 4.5,
    entry_ev: 95,
    entry_ebitda: 12,
    entry_revenue: 44,
    entry_leverage: 3.8,
    entry_ev_ebitda: 7.9,
    current_nav: 228,
    moic: 3.4,
    irr: 31.2,
    revenue_growth: 18.4,
    ebitda_margin: 34.2,
    employees: 420,
    hq: 'London, UK',
    description: 'Apex Financial Services is a specialty insurance MGA and program administrator focused on SME commercial lines. The business manages over £380M of gross written premium across 12 specialty programs, leveraging proprietary underwriting technology and data analytics for superior risk selection.',
    investment_thesis: 'Exited via secondary buyout to Inflexion Private Equity at 19.2x EBITDA (September 2018). The investment delivered 3.4x MOIC driven by strong organic growth (18% CAGR), new program launches, and multiple expansion from 7.9x to 19.2x as the market re-rated quality MGA businesses.',
    management: [
      { name: 'David Fitzpatrick', title: 'Chief Executive Officer', tenure_years: 10 },
      { name: 'Rachel Goodwin', title: 'Chief Financial Officer', tenure_years: 7 },
    ],
    swot: {
      strengths: 'Proprietary underwriting technology platform; Experienced specialty underwriting team; Diversified program portfolio across 12 lines; Strong carrier relationships',
      weaknesses: 'Carrier concentration: top 3 carriers represent 62% of capacity; Regulatory complexity across multiple jurisdictions',
      opportunities: 'Lloyd\'s market access for new specialty programs; Continental European expansion; Tech-enabled product extensions',
      threats: 'Capacity withdrawal in hard market; Regulatory changes to MGA oversight; Insurtech competition',
    },
    key_metrics: [
      { label: 'GWP', value: '£382M', change: '+18%' },
      { label: 'Commission Income', value: '£52M', change: '+22%' },
      { label: 'Combined Ratio', value: '89%', change: '-2pp' },
      { label: 'EBITDA Margin', value: '34.2%', change: '+4pp' },
      { label: 'Programs', value: '12', change: '+3' },
      { label: 'Carrier Partners', value: '24', change: '+6' },
    ],
    comparable_companies: [
      { name: 'AmTrust Financial', ev_ebitda: 14.2, rev_growth: 12.4, ebitda_margin: 28.1, is_subject: false },
      { name: 'Global Indemnity Group', ev_ebitda: 11.8, rev_growth: 8.7, ebitda_margin: 26.3, is_subject: false },
      { name: 'Apex Financial Services', ev_ebitda: 19.2, rev_growth: 18.4, ebitda_margin: 34.2, is_subject: true },
    ],
    historical_financials: [
      { year: 2014, revenue: 44, ebitda: 12, valuation: 95 },
      { year: 2015, revenue: 56, ebitda: 16, valuation: 130 },
      { year: 2016, revenue: 68, ebitda: 21, valuation: 165 },
      { year: 2017, revenue: 84, ebitda: 28, valuation: 200 },
      { year: 2018, revenue: 102, ebitda: 35, valuation: 228 },
    ],
    predictions: {
      survival_curve: [
        { time: 0, probability: 1.0 },
        { time: 1, probability: 0.90 },
        { time: 2, probability: 0.0 },
      ],
      moic_distribution: [
        { moic: 1.5, frequency: 3 },
        { moic: 2.0, frequency: 8 },
        { moic: 2.5, frequency: 16 },
        { moic: 3.0, frequency: 24 },
        { moic: 3.5, frequency: 22 },
        { moic: 4.0, frequency: 16 },
        { moic: 4.5, frequency: 8 },
        { moic: 5.0, frequency: 3 },
      ],
      p10: 2.2,
      p50: 3.4,
      p90: 4.8,
    },
  },
]

export const MOCK_OVERVIEW = {
  portfolio_nav: 4200000000,
  expected_dpi: 1.8,
  expected_tvpi: 2.3,
  active_companies: 32,
  exits_next_24m: 7,
  liquidity_forecast: 480000000,
  nav_evolution: [
    { year: 2019, nav: 1850, committed: 2100 },
    { year: 2020, nav: 2120, committed: 2800 },
    { year: 2021, nav: 2840, committed: 3400 },
    { year: 2022, nav: 3380, committed: 3900 },
    { year: 2023, nav: 4200, committed: 4200 },
  ],
  cash_flow_fan: [
    { year: 1, p10: 180, p25: 220, p50: 280, p75: 340, p90: 420, p10_25_range: [180, 220], p25_75_range: [220, 340], p75_90_range: [340, 420] },
    { year: 2, p10: 290, p25: 360, p50: 450, p75: 550, p90: 680, p10_25_range: [290, 360], p25_75_range: [360, 550], p75_90_range: [550, 680] },
    { year: 3, p10: 420, p25: 520, p50: 650, p75: 800, p90: 980, p10_25_range: [420, 520], p25_75_range: [520, 800], p75_90_range: [800, 980] },
    { year: 4, p10: 580, p25: 720, p50: 900, p75: 1100, p90: 1350, p10_25_range: [580, 720], p25_75_range: [720, 1100], p75_90_range: [1100, 1350] },
    { year: 5, p10: 750, p25: 950, p50: 1200, p75: 1480, p90: 1820, p10_25_range: [750, 950], p25_75_range: [950, 1480], p75_90_range: [1480, 1820] },
  ],
  exit_timing: [
    { year: '2024', exits: 2, proceeds: 380 },
    { year: '2025', exits: 3, proceeds: 680 },
    { year: '2026', exits: 5, proceeds: 1120 },
    { year: '2027', exits: 6, proceeds: 1380 },
    { year: '2028', exits: 4, proceeds: 920 },
    { year: '2029', exits: 3, proceeds: 680 },
  ],
  fund_performance: [
    { fund: 'Fund I', vintage: 2014, committed: 800, nav: 1240, dpi: 2.8, tvpi: 3.4, irr: 24.2, status: 'Harvesting' },
    { fund: 'Fund II', vintage: 2017, committed: 1200, nav: 1680, dpi: 1.2, tvpi: 2.1, irr: 19.8, status: 'Value Creation' },
    { fund: 'Fund III', vintage: 2020, committed: 1800, nav: 1280, dpi: 0.3, tvpi: 1.4, irr: 22.4, status: 'Investing' },
  ],
  moic_distribution: [
    { moic: '0.5x', count: 2 },
    { moic: '1.0x', count: 3 },
    { moic: '1.5x', count: 7 },
    { moic: '2.0x', count: 9 },
    { moic: '2.5x', count: 6 },
    { moic: '3.0x', count: 4 },
    { moic: '3.5x', count: 3 },
    { moic: '4.0x', count: 2 },
    { moic: '4.5x', count: 1 },
  ],
}

export const MOCK_FUNDS = {
  1: {
    id: 1,
    name: 'Fund I',
    vintage: 2014,
    committed: 800,
    deployed: 780,
    nav: 1240,
    dpi: 2.8,
    tvpi: 3.4,
    rvpi: 0.6,
    irr: 24.2,
    status: 'Harvesting',
    companies: [
      { id: 5, name: 'Apex Financial Services', status: 'Exited', nav: 228, moic: 3.4, sector: 'Financial Services' },
      { id: 6, name: 'Northgate Logistics', status: 'Exited', nav: 310, moic: 2.9, sector: 'Industrials' },
      { id: 7, name: 'Vantage Education Group', status: 'Active', nav: 180, moic: 2.1, sector: 'Education' },
      { id: 8, name: 'BlueSky Media', status: 'Exited', nav: 155, moic: 1.8, sector: 'Media' },
    ],
    cash_flows: [
      { year: 2014, investments: -180, distributions: 0 },
      { year: 2015, investments: -220, distributions: 0 },
      { year: 2016, investments: -180, distributions: 45 },
      { year: 2017, investments: -120, distributions: 180 },
      { year: 2018, investments: -80, distributions: 320 },
      { year: 2019, investments: 0, distributions: 280 },
      { year: 2020, investments: 0, distributions: 240 },
      { year: 2021, investments: 0, distributions: 420 },
      { year: 2022, investments: 0, distributions: 380 },
      { year: 2023, investments: 0, distributions: 280 },
    ],
    monte_carlo: [
      { year: 1, p10: 0.8, p25: 0.9, p50: 1.0, p75: 1.15, p90: 1.3, p10_25_range: [0.8, 0.9], p25_75_range: [0.9, 1.15], p75_90_range: [1.15, 1.3] },
      { year: 2, p10: 1.2, p25: 1.5, p50: 1.8, p75: 2.2, p90: 2.7, p10_25_range: [1.2, 1.5], p25_75_range: [1.5, 2.2], p75_90_range: [2.2, 2.7] },
      { year: 3, p10: 1.8, p25: 2.2, p50: 2.8, p75: 3.4, p90: 4.1, p10_25_range: [1.8, 2.2], p25_75_range: [2.2, 3.4], p75_90_range: [3.4, 4.1] },
      { year: 4, p10: 2.4, p25: 3.0, p50: 3.4, p75: 4.0, p90: 4.8, p10_25_range: [2.4, 3.0], p25_75_range: [3.0, 4.0], p75_90_range: [4.0, 4.8] },
      { year: 5, p10: 2.8, p25: 3.2, p50: 3.6, p75: 4.2, p90: 5.0, p10_25_range: [2.8, 3.2], p25_75_range: [3.2, 4.2], p75_90_range: [4.2, 5.0] },
    ],
  },
  2: {
    id: 2,
    name: 'Fund II',
    vintage: 2017,
    committed: 1200,
    deployed: 1150,
    nav: 1680,
    dpi: 1.2,
    tvpi: 2.1,
    rvpi: 0.9,
    irr: 19.8,
    status: 'Value Creation',
    companies: [
      { id: 2, name: 'Pinnacle Health Partners', status: 'Active', nav: 290, moic: 1.9, sector: 'Healthcare' },
      { id: 3, name: 'Meridian Industrials Group', status: 'Exited', nav: 480, moic: 2.8, sector: 'Industrials' },
      { id: 9, name: 'Castlerock Retail Group', status: 'Active', nav: 210, moic: 1.4, sector: 'Consumer' },
      { id: 10, name: 'Delta Energy Services', status: 'Active', nav: 280, moic: 1.7, sector: 'Energy' },
      { id: 11, name: 'Prestige Hotels & Resorts', status: 'Active', nav: 180, moic: 1.3, sector: 'Hospitality' },
      { id: 12, name: 'Greenfield Agriculture', status: 'Exited', nav: 240, moic: 2.2, sector: 'Agriculture' },
    ],
    cash_flows: [
      { year: 2017, investments: -280, distributions: 0 },
      { year: 2018, investments: -320, distributions: 0 },
      { year: 2019, investments: -280, distributions: 80 },
      { year: 2020, investments: -180, distributions: 120 },
      { year: 2021, investments: -90, distributions: 280 },
      { year: 2022, investments: 0, distributions: 380 },
      { year: 2023, investments: 0, distributions: 420 },
    ],
    monte_carlo: [
      { year: 1, p10: 0.7, p25: 0.85, p50: 1.0, p75: 1.2, p90: 1.4, p10_25_range: [0.7, 0.85], p25_75_range: [0.85, 1.2], p75_90_range: [1.2, 1.4] },
      { year: 2, p10: 1.0, p25: 1.3, p50: 1.6, p75: 2.0, p90: 2.5, p10_25_range: [1.0, 1.3], p25_75_range: [1.3, 2.0], p75_90_range: [2.0, 2.5] },
      { year: 3, p10: 1.4, p25: 1.8, p50: 2.2, p75: 2.8, p90: 3.5, p10_25_range: [1.4, 1.8], p25_75_range: [1.8, 2.8], p75_90_range: [2.8, 3.5] },
      { year: 4, p10: 1.7, p25: 2.1, p50: 2.6, p75: 3.2, p90: 4.0, p10_25_range: [1.7, 2.1], p25_75_range: [2.1, 3.2], p75_90_range: [3.2, 4.0] },
      { year: 5, p10: 1.9, p25: 2.4, p50: 3.0, p75: 3.7, p90: 4.5, p10_25_range: [1.9, 2.4], p25_75_range: [2.4, 3.7], p75_90_range: [3.7, 4.5] },
    ],
  },
  3: {
    id: 3,
    name: 'Fund III',
    vintage: 2020,
    committed: 1800,
    deployed: 1240,
    nav: 1280,
    dpi: 0.3,
    tvpi: 1.4,
    rvpi: 1.1,
    irr: 22.4,
    status: 'Investing',
    companies: [
      { id: 1, name: 'NovaTech Systems', status: 'Active', nav: 510, moic: 2.3, sector: 'Technology' },
      { id: 4, name: 'Clearwater Consumer Brands', status: 'Active', nav: 440, moic: 1.2, sector: 'Consumer' },
      { id: 13, name: 'Quantum Analytics Inc.', status: 'Active', nav: 180, moic: 1.8, sector: 'Technology' },
      { id: 14, name: 'Pacific Renewable Energy', status: 'Active', nav: 150, moic: 1.5, sector: 'Energy' },
    ],
    cash_flows: [
      { year: 2020, investments: -320, distributions: 0 },
      { year: 2021, investments: -480, distributions: 0 },
      { year: 2022, investments: -280, distributions: 40 },
      { year: 2023, investments: -160, distributions: 120 },
      { year: 2024, investments: -80, distributions: 200 },
    ],
    monte_carlo: [
      { year: 1, p10: 0.6, p25: 0.8, p50: 1.0, p75: 1.25, p90: 1.5, p10_25_range: [0.6, 0.8], p25_75_range: [0.8, 1.25], p75_90_range: [1.25, 1.5] },
      { year: 2, p10: 0.9, p25: 1.2, p50: 1.5, p75: 1.9, p90: 2.4, p10_25_range: [0.9, 1.2], p25_75_range: [1.2, 1.9], p75_90_range: [1.9, 2.4] },
      { year: 3, p10: 1.2, p25: 1.6, p50: 2.1, p75: 2.7, p90: 3.4, p10_25_range: [1.2, 1.6], p25_75_range: [1.6, 2.7], p75_90_range: [2.7, 3.4] },
      { year: 4, p10: 1.5, p25: 2.0, p50: 2.6, p75: 3.3, p90: 4.1, p10_25_range: [1.5, 2.0], p25_75_range: [2.0, 3.3], p75_90_range: [3.3, 4.1] },
      { year: 5, p10: 1.8, p25: 2.4, p50: 3.1, p75: 4.0, p90: 5.0, p10_25_range: [1.8, 2.4], p25_75_range: [2.4, 4.0], p75_90_range: [4.0, 5.0] },
    ],
  },
}

export const MOCK_SURVIVAL = {
  sector: {
    curves: [
      { time: 0, Technology: 1.0, Healthcare: 1.0, Industrials: 1.0, Consumer: 1.0, 'Financial Services': 1.0 },
      { time: 1, Technology: 0.94, Healthcare: 0.90, Industrials: 0.92, Consumer: 0.86, 'Financial Services': 0.88 },
      { time: 2, Technology: 0.84, Healthcare: 0.78, Industrials: 0.82, Consumer: 0.72, 'Financial Services': 0.76 },
      { time: 3, Technology: 0.72, Healthcare: 0.64, Industrials: 0.70, Consumer: 0.58, 'Financial Services': 0.62 },
      { time: 4, Technology: 0.58, Healthcare: 0.50, Industrials: 0.56, Consumer: 0.44, 'Financial Services': 0.48 },
      { time: 5, Technology: 0.44, Healthcare: 0.37, Industrials: 0.41, Consumer: 0.31, 'Financial Services': 0.35 },
      { time: 6, Technology: 0.32, Healthcare: 0.26, Industrials: 0.28, Consumer: 0.20, 'Financial Services': 0.24 },
      { time: 7, Technology: 0.22, Healthcare: 0.17, Industrials: 0.18, Consumer: 0.13, 'Financial Services': 0.15 },
      { time: 8, Technology: 0.14, Healthcare: 0.10, Industrials: 0.11, Consumer: 0.07, 'Financial Services': 0.09 },
      { time: 9, Technology: 0.08, Healthcare: 0.06, Industrials: 0.06, Consumer: 0.04, 'Financial Services': 0.05 },
      { time: 10, Technology: 0.04, Healthcare: 0.03, Industrials: 0.03, Consumer: 0.02, 'Financial Services': 0.02 },
    ],
    groups: ['Technology', 'Healthcare', 'Industrials', 'Consumer', 'Financial Services'],
    hazard_rates: [
      { sector: 'Consumer', hazard: 0.142 },
      { sector: 'Financial Services', hazard: 0.124 },
      { sector: 'Healthcare', hazard: 0.108 },
      { sector: 'Industrials', hazard: 0.096 },
      { sector: 'Technology', hazard: 0.082 },
    ],
    insights: {
      median_time_to_exit: 4.2,
      five_year_exit_probability: 65,
      highest_risk: 'Consumer',
      lowest_risk: 'Technology',
    },
    heatmap: [
      { sector: 'Technology', '2014': 0.95, '2016': 0.88, '2018': 0.76, '2020': 0.62, '2022': 0.45 },
      { sector: 'Healthcare', '2014': 0.92, '2016': 0.84, '2018': 0.70, '2020': 0.56, '2022': 0.40 },
      { sector: 'Industrials', '2014': 0.90, '2016': 0.82, '2018': 0.68, '2020': 0.54, '2022': 0.38 },
      { sector: 'Consumer', '2014': 0.88, '2016': 0.78, '2018': 0.62, '2020': 0.48, '2022': 0.32 },
      { sector: 'Fin. Services', '2014': 0.91, '2016': 0.80, '2018': 0.65, '2020': 0.50, '2022': 0.35 },
    ],
    vintage_table: [
      { vintage: 2014, cohort_size: 8, exited: 7, active: 1, median_hold: 4.8, avg_moic: 2.9, five_yr_exit_rate: '88%' },
      { vintage: 2016, cohort_size: 10, exited: 7, active: 3, median_hold: 5.1, avg_moic: 2.4, five_yr_exit_rate: '70%' },
      { vintage: 2018, cohort_size: 9, exited: 4, active: 5, median_hold: 4.4, avg_moic: 2.1, five_yr_exit_rate: '44%' },
      { vintage: 2020, cohort_size: 8, exited: 1, active: 7, median_hold: 3.2, avg_moic: 1.6, five_yr_exit_rate: '13%' },
      { vintage: 2022, cohort_size: 5, exited: 0, active: 5, median_hold: 1.8, avg_moic: 1.2, five_yr_exit_rate: '0%' },
    ],
  },
}

export const MOCK_SHAP = {
  1: {
    features: [
      { feature: 'Revenue Growth Rate', shap_value: 0.412 },
      { feature: 'Entry EV/EBITDA', shap_value: -0.284 },
      { feature: 'EBITDA Margin', shap_value: 0.268 },
      { feature: 'Net Leverage', shap_value: -0.224 },
      { feature: 'Sector (Technology)', shap_value: 0.198 },
      { feature: 'Holding Period', shap_value: -0.142 },
      { feature: 'Geography (NA)', shap_value: 0.094 },
      { feature: 'Vintage Year', shap_value: -0.068 },
      { feature: 'Fund Size', shap_value: 0.042 },
      { feature: 'Management Tenure', shap_value: 0.038 },
    ],
    base_value: 1.82,
    prediction: 2.3,
    explanation: 'The predicted MOIC of 2.3x for NovaTech Systems is primarily driven by its strong revenue growth rate (+0.41 contribution), which significantly exceeds portfolio median. The EBITDA margin expansion (+0.27) and technology sector premium (+0.20) further support the above-median outcome. These positive factors are partially offset by the elevated entry valuation multiple (-0.28) and financial leverage (-0.22). The model assigns high confidence to this estimate given the company\'s consistent outperformance of entry case projections.',
    partial_dependence: {
      revenue_growth: [
        { x: 0, y: 1.2 }, { x: 5, y: 1.4 }, { x: 10, y: 1.6 }, { x: 15, y: 1.85 },
        { x: 20, y: 2.1 }, { x: 25, y: 2.4 }, { x: 30, y: 2.65 }, { x: 35, y: 2.85 },
      ],
      ebitda_margin: [
        { x: 10, y: 1.4 }, { x: 15, y: 1.6 }, { x: 20, y: 1.85 }, { x: 25, y: 2.1 },
        { x: 30, y: 2.35 }, { x: 35, y: 2.55 }, { x: 40, y: 2.7 },
      ],
      net_leverage: [
        { x: 2, y: 2.8 }, { x: 3, y: 2.6 }, { x: 4, y: 2.3 }, { x: 5, y: 2.0 },
        { x: 6, y: 1.75 }, { x: 7, y: 1.5 }, { x: 8, y: 1.3 },
      ],
    },
  },
}

export const MOCK_NEWS = {
  1: [
    {
      id: 1,
      date: '2024-01-15',
      source: 'TechCrunch',
      title: 'NovaTech Systems announces EU expansion, opens Frankfurt engineering hub',
      summary: 'NovaTech Systems has announced the opening of its European headquarters in Frankfurt, Germany, marking its first major international expansion. The 120-person engineering and sales hub will serve as the base for EU market penetration, targeting the DACH region as the initial go-to-market.',
      sentiment: 'positive',
      sentiment_score: 0.82,
    },
    {
      id: 2,
      date: '2024-01-08',
      source: 'Supply Chain Dive',
      title: 'NovaTech raises Series D funding; valuation reaches $2.1B',
      summary: 'NovaTech Systems closed a $120M Series D round led by existing PE sponsor Meridian Capital, with participation from strategic investor SAP Ventures. The funding will be used to accelerate AI product development and international expansion.',
      sentiment: 'positive',
      sentiment_score: 0.91,
    },
    {
      id: 3,
      date: '2023-12-12',
      source: 'Gartner',
      title: 'NovaTech named Leader in 2023 Gartner Magic Quadrant for Supply Chain Planning',
      summary: 'NovaTech Systems has been positioned as a Leader in the Gartner Magic Quadrant for Supply Chain Planning Suites for the second consecutive year, recognized for its completeness of vision and execution capability.',
      sentiment: 'positive',
      sentiment_score: 0.94,
    },
    {
      id: 4,
      date: '2023-11-28',
      source: 'Wall Street Journal',
      title: 'Supply chain software market faces intensifying competition from Oracle, SAP native modules',
      summary: 'Enterprise software giants Oracle and SAP are reportedly accelerating development of native supply chain planning modules that could compete directly with specialist vendors. Analysts note the risk to standalone SCM software companies.',
      sentiment: 'negative',
      sentiment_score: -0.42,
    },
    {
      id: 5,
      date: '2023-11-10',
      source: 'Forbes',
      title: 'NovaTech Systems CFO Sarah Chen named to Forbes CFO Next 2023 list',
      summary: 'Sarah Chen, CFO of NovaTech Systems, has been recognized on the Forbes CFO Next list, which honors finance executives who demonstrate exceptional leadership and transformative impact.',
      sentiment: 'positive',
      sentiment_score: 0.68,
    },
  ],
}

export const MOCK_BUSINESS_PLAN = `
## Strategic Business Plan: NovaTech Systems (2024-2027)

### Executive Summary
NovaTech Systems is positioned to achieve a 3-year revenue CAGR of 22-25% through disciplined execution of its European expansion strategy, AI product line extension, and continued penetration of its existing North American base. The management team has demonstrated consistent operational execution against plan, underpinning confidence in the medium-term financial targets.

### 1. Market Opportunity
The global supply chain management software market is valued at $28.4B and projected to grow at 11.4% CAGR through 2028, driven by post-pandemic supply chain resilience investment and AI-enabled demand forecasting adoption. NovaTech's addressable market within enterprise SCM is estimated at $8.2B, with current penetration of approximately 1.1%.

**Key Market Drivers:**
- Enterprise investment in supply chain digitalization accelerating post-COVID disruption
- AI/ML integration becoming table-stakes in SCM platform evaluation criteria
- Regulatory complexity (ESG reporting, trade compliance) driving platform adoption
- Nearshoring/reshoring trends increasing complexity and planning requirements

### 2. Strategic Initiatives

**Initiative 1: European Market Entry (2024-2025)**
- Target: 40 enterprise logos by end of 2025, €25M ARR
- Go-to-market: DACH region focus via Frankfurt hub; leverage existing SAP ecosystem partnerships
- Investment: €12M capex for office, headcount (80 FTEs)
- Break-even: Q4 2025

**Initiative 2: AI Demand Forecasting Module (H1 2024 launch)**
- Launching NovaSense AI, an ML-powered demand forecasting and inventory optimization module
- Priced at 30% premium to base platform; cross-sell opportunity to 100% of existing base
- Target: 35% attach rate within 18 months, contributing $18M incremental ARR

**Initiative 3: Partner Ecosystem Expansion**
- Grow certified implementation partners from 2,400 to 4,000 by 2026
- Priority: EMEA systems integrators (Accenture, Deloitte, Capgemini EU practices)
- Establish dedicated Partner Success organization (12 FTEs)

### 3. Financial Projections

| Metric | 2023A | 2024E | 2025E | 2026E | 2027E |
|--------|-------|-------|-------|-------|-------|
| Revenue ($M) | 144 | 178 | 220 | 272 | 336 |
| Growth | 22% | 24% | 24% | 24% | 24% |
| EBITDA ($M) | 45 | 58 | 75 | 96 | 122 |
| EBITDA Margin | 31% | 33% | 34% | 35% | 36% |
| ARR ($M) | 87 | 110 | 140 | 178 | 224 |

### 4. Exit Considerations
Based on current trajectory and comparable transaction multiples (20-25x EBITDA for high-quality SaaS with >20% growth and >30% EBITDA margins), the expected exit valuation range is $1.8B-$2.4B in a 2026-2027 timeframe. Strategic acquirers (SAP, Oracle, Infor) and financial sponsors represent viable exit pathways.

### 5. Key Risks and Mitigants
- **Competition risk:** Monitor Oracle/SAP native module development; accelerate product differentiation through AI capabilities
- **Execution risk:** EU expansion; mitigated by proven playbook from Canada market entry
- **Key person risk:** CEO retention through 2025 exit planning; management equity rollover in place
- **Macro risk:** Enterprise IT budget compression; NovaTech's ROI-positive value proposition historically resilient
`

// ============================================================
// MOCK DATA FOR DEALS / FUND MODEL DASHBOARD
// Three-level hierarchy: Transaction → Fund → Company
// Used as fallback when API is unavailable
// ============================================================

// Generate 6 trailing quarterly column keys relative to a base date
function quarterKeys(baseYear = 2025, baseQuarter = 3) {
  const months = ['Mar', 'Jun', 'Sep', 'Dec']
  const keys = []
  let q = baseQuarter
  let y = baseYear
  for (let i = 0; i < 6; i++) {
    keys.unshift(`${months[q]}-${String(y).slice(2)}`)
    q--
    if (q < 0) { q = 3; y-- }
  }
  return keys
}

export const QUARTER_KEYS = quarterKeys()

// Helper: generate plausible quarterly NAV progression
function quarterlyNavs(baseNav, trend = 0.04) {
  const result = {}
  let v = baseNav * 0.78
  QUARTER_KEYS.forEach(k => {
    v = v * (1 + trend + (Math.random() * 0.02 - 0.01))
    result[k] = Math.round(v * 10) / 10
  })
  return result
}

// ── Company rows for Fund 1 (fund_001) ──────────────────────────────────────

const FUND1_COMPANIES = [
  {
    id: 'comp_001', name: 'Apex Systems', sector: 'Technology', status: 'active',
    exit_date: null, cost_m: 85.0, proceeds_m: 0, nav_m: 162.0, exit_value_m: 162.0,
    cost_x: 1.0, nav_x: 1.91,
    quarterly_navs: quarterlyNavs(162, 0.042),
  },
  {
    id: 'comp_002', name: 'BioMedica Group', sector: 'Healthcare', status: 'active',
    exit_date: null, cost_m: 60.0, proceeds_m: 0, nav_m: 99.0, exit_value_m: 99.0,
    cost_x: 1.0, nav_x: 1.65,
    quarterly_navs: quarterlyNavs(99, 0.032),
  },
  {
    id: 'comp_003', name: 'Atlas Manufacturing', sector: 'Industrials', status: 'active',
    exit_date: null, cost_m: 45.0, proceeds_m: 0, nav_m: 67.5, exit_value_m: 67.5,
    cost_x: 1.0, nav_x: 1.50,
    quarterly_navs: quarterlyNavs(67.5, 0.028),
  },
  {
    id: 'comp_004', name: 'Ardian Capital Partners', sector: 'Financial Services', status: 'active',
    exit_date: null, cost_m: 55.0, proceeds_m: 0, nav_m: 88.0, exit_value_m: 88.0,
    cost_x: 1.0, nav_x: 1.60,
    quarterly_navs: quarterlyNavs(88, 0.035),
  },
  {
    id: 'comp_005', name: 'Solaris Energy Ltd', sector: 'Energy', status: 'exited',
    exit_date: '2024-09-15', cost_m: 40.0, proceeds_m: 84.0, nav_m: 0, exit_value_m: 84.0,
    cost_x: 1.0, nav_x: 2.10,
    quarterly_navs: { [QUARTER_KEYS[0]]: 75, [QUARTER_KEYS[1]]: 79, [QUARTER_KEYS[2]]: 83, [QUARTER_KEYS[3]]: 84, [QUARTER_KEYS[4]]: 84, [QUARTER_KEYS[5]]: 84 },
  },
  {
    id: 'comp_006', name: 'Vega Consumer Brands', sector: 'Consumer', status: 'active',
    exit_date: null, cost_m: 38.0, proceeds_m: 0, nav_m: 53.2, exit_value_m: 53.2,
    cost_x: 1.0, nav_x: 1.40,
    quarterly_navs: quarterlyNavs(53.2, 0.025),
  },
  {
    id: 'comp_007', name: 'Horizon Logistics', sector: 'Industrials', status: 'active',
    exit_date: null, cost_m: 50.0, proceeds_m: 0, nav_m: 80.0, exit_value_m: 80.0,
    cost_x: 1.0, nav_x: 1.60,
    quarterly_navs: quarterlyNavs(80, 0.030),
  },
]

// ── Company rows for Fund 2 (fund_002) ──────────────────────────────────────

const FUND2_COMPANIES = [
  {
    id: 'comp_011', name: 'NovaTech Systems', sector: 'Technology', status: 'active',
    exit_date: null, cost_m: 140.0, proceeds_m: 0, nav_m: 322.0, exit_value_m: 322.0,
    cost_x: 1.0, nav_x: 2.30,
    quarterly_navs: quarterlyNavs(322, 0.050),
  },
  {
    id: 'comp_012', name: 'PharmaVentures', sector: 'Healthcare', status: 'active',
    exit_date: null, cost_m: 90.0, proceeds_m: 0, nav_m: 162.0, exit_value_m: 162.0,
    cost_x: 1.0, nav_x: 1.80,
    quarterly_navs: quarterlyNavs(162, 0.038),
  },
  {
    id: 'comp_013', name: 'DataStream Analytics', sector: 'Technology', status: 'active',
    exit_date: null, cost_m: 75.0, proceeds_m: 0, nav_m: 150.0, exit_value_m: 150.0,
    cost_x: 1.0, nav_x: 2.00,
    quarterly_navs: quarterlyNavs(150, 0.045),
  },
  {
    id: 'comp_014', name: 'Global Trade Solutions', sector: 'Financial Services', status: 'exited',
    exit_date: '2024-03-22', cost_m: 65.0, proceeds_m: 130.0, nav_m: 0, exit_value_m: 130.0,
    cost_x: 1.0, nav_x: 2.00,
    quarterly_navs: { [QUARTER_KEYS[0]]: 118, [QUARTER_KEYS[1]]: 124, [QUARTER_KEYS[2]]: 128, [QUARTER_KEYS[3]]: 130, [QUARTER_KEYS[4]]: 130, [QUARTER_KEYS[5]]: 130 },
  },
  {
    id: 'comp_015', name: 'CleanTech Innovations', sector: 'Energy', status: 'active',
    exit_date: null, cost_m: 55.0, proceeds_m: 0, nav_m: 77.0, exit_value_m: 77.0,
    cost_x: 1.0, nav_x: 1.40,
    quarterly_navs: quarterlyNavs(77, 0.022),
  },
]

// ── Company rows for Fund 3 (fund_003) ──────────────────────────────────────

const FUND3_COMPANIES = [
  {
    id: 'comp_021', name: 'Quantum Software', sector: 'Technology', status: 'active',
    exit_date: null, cost_m: 200.0, proceeds_m: 0, nav_m: 320.0, exit_value_m: 320.0,
    cost_x: 1.0, nav_x: 1.60,
    quarterly_navs: quarterlyNavs(320, 0.038),
  },
  {
    id: 'comp_022', name: 'MedDevice Corp', sector: 'Healthcare', status: 'active',
    exit_date: null, cost_m: 120.0, proceeds_m: 0, nav_m: 204.0, exit_value_m: 204.0,
    cost_x: 1.0, nav_x: 1.70,
    quarterly_navs: quarterlyNavs(204, 0.033),
  },
  {
    id: 'comp_023', name: 'EuroRetail Holdings', sector: 'Consumer', status: 'active',
    exit_date: null, cost_m: 95.0, proceeds_m: 0, nav_m: 133.0, exit_value_m: 133.0,
    cost_x: 1.0, nav_x: 1.40,
    quarterly_navs: quarterlyNavs(133, 0.028),
  },
  {
    id: 'comp_024', name: 'Infrastructure Partners', sector: 'Industrials', status: 'active',
    exit_date: null, cost_m: 150.0, proceeds_m: 0, nav_m: 225.0, exit_value_m: 225.0,
    cost_x: 1.0, nav_x: 1.50,
    quarterly_navs: quarterlyNavs(225, 0.030),
  },
  {
    id: 'comp_025', name: 'FinEdge Platform', sector: 'Financial Services', status: 'exited',
    exit_date: '2023-11-30', cost_m: 80.0, proceeds_m: 176.0, nav_m: 0, exit_value_m: 176.0,
    cost_x: 1.0, nav_x: 2.20,
    quarterly_navs: { [QUARTER_KEYS[0]]: 158, [QUARTER_KEYS[1]]: 165, [QUARTER_KEYS[2]]: 172, [QUARTER_KEYS[3]]: 176, [QUARTER_KEYS[4]]: 176, [QUARTER_KEYS[5]]: 176 },
  },
  {
    id: 'comp_026', name: 'Renewable Grid Co', sector: 'Energy', status: 'active',
    exit_date: null, cost_m: 110.0, proceeds_m: 0, nav_m: 165.0, exit_value_m: 165.0,
    cost_x: 1.0, nav_x: 1.50,
    quarterly_navs: quarterlyNavs(165, 0.032),
  },
]

// ── Funds ────────────────────────────────────────────────────────────────────

function computeFundTotals(companies) {
  const total = {
    cost_m: 0, proceeds_m: 0, nav_m: 0, exit_value_m: 0,
    quarterly_navs: {},
  }
  QUARTER_KEYS.forEach(k => { total.quarterly_navs[k] = 0 })
  companies.forEach(c => {
    total.cost_m += c.cost_m
    total.proceeds_m += c.proceeds_m
    total.nav_m += c.nav_m
    total.exit_value_m += c.exit_value_m
    QUARTER_KEYS.forEach(k => { total.quarterly_navs[k] += (c.quarterly_navs[k] || 0) })
  })
  // Round
  total.cost_m = Math.round(total.cost_m * 10) / 10
  total.proceeds_m = Math.round(total.proceeds_m * 10) / 10
  total.nav_m = Math.round(total.nav_m * 10) / 10
  total.exit_value_m = Math.round(total.exit_value_m * 10) / 10
  QUARTER_KEYS.forEach(k => {
    total.quarterly_navs[k] = Math.round(total.quarterly_navs[k] * 10) / 10
  })
  const totalCost = total.cost_m || 1
  total.cost_x = 1.0
  total.nav_x = Math.round((total.exit_value_m / totalCost) * 100) / 100
  return total
}

export const MOCK_FUNDS_DEAL = {
  fund_001: {
    id: 'fund_001', name: 'Ardian Sec VII – Fund A', deal_id: 'deal_001',
    committed_m: 500, nav_m: 649.7, vintage: 2022,
    companies: FUND1_COMPANIES,
  },
  fund_002: {
    id: 'fund_002', name: 'Ardian Sec VII – Fund B', deal_id: 'deal_001',
    committed_m: 425, nav_m: 1011.0, vintage: 2022,
    companies: FUND2_COMPANIES,
  },
  fund_003: {
    id: 'fund_003', name: 'Ardian Prim V – Main Fund', deal_id: 'deal_002',
    committed_m: 750, nav_m: 1223.0, vintage: 2021,
    companies: FUND3_COMPANIES,
  },
}

// ── Deals ─────────────────────────────────────────────────────────────────────

export const MOCK_DEALS = [
  {
    id: 'deal_001',
    name: 'Ardian Secondaries VII',
    vintage: 2022,
    committed_m: 925,
    currency: 'USD',
    status: 'Active',
    fund_ids: ['fund_001', 'fund_002'],
    description: 'Secondaries portfolio targeting mid-market buyouts across Technology, Healthcare, and Industrials in North America and Europe.',
    total_nav_m: 1660.7,
    total_companies: FUND1_COMPANIES.length + FUND2_COMPANIES.length,
    moic: 1.96,
    irr: 18.4,
  },
  {
    id: 'deal_002',
    name: 'Ardian Primaries V',
    vintage: 2021,
    committed_m: 750,
    currency: 'USD',
    status: 'Active',
    fund_ids: ['fund_003'],
    description: 'Primaries strategy focused on large-cap buyout funds with diversified sector exposure across Europe and North America.',
    total_nav_m: 1223.0,
    total_companies: FUND3_COMPANIES.length,
    moic: 1.63,
    irr: 14.2,
  },
]

export const MOCK_DEALS_OVERVIEW = {
  total_aum_m: 2883.7,
  active_deals: 2,
  total_funds: 3,
  total_companies: FUND1_COMPANIES.length + FUND2_COMPANIES.length + FUND3_COMPANIES.length,
}

// Export fund model helper for frontend use
export function getMockFundModel(fundId) {
  const fund = MOCK_FUNDS_DEAL[fundId]
  if (!fund) return null
  return {
    ...fund,
    totals: computeFundTotals(fund.companies),
  }
}

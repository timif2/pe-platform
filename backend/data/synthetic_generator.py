"""
Synthetic PE Portfolio Data Generator.

Generates realistic private equity portfolio data for 3 funds and 45 companies.
Uses numpy random with seed=42 for reproducibility.
"""
from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

import numpy as np

# ---------------------------------------------------------------------------
# Module-level cache
# ---------------------------------------------------------------------------
DATA_CACHE: Dict[str, Any] = {}


def get_data() -> Dict[str, Any]:
    """Lazily generate and cache portfolio data."""
    if not DATA_CACHE:
        generator = DataGenerator()
        result = generator.generate()
        DATA_CACHE.update(result)
    return DATA_CACHE


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SECTORS = ["Technology", "Healthcare", "Industrials", "Consumer", "Financial Services", "Energy"]

SECTOR_PARAMS: Dict[str, Dict[str, Any]] = {
    "Technology": {
        "growth_range": (0.15, 0.28),
        "margin_range": (0.28, 0.45),
        "ev_ebitda_range": (12, 18),
        "gics": "Information Technology",
    },
    "Healthcare": {
        "growth_range": (0.10, 0.20),
        "margin_range": (0.22, 0.38),
        "ev_ebitda_range": (11, 15),
        "gics": "Health Care",
    },
    "Industrials": {
        "growth_range": (0.06, 0.14),
        "margin_range": (0.14, 0.25),
        "ev_ebitda_range": (7, 11),
        "gics": "Industrials",
    },
    "Consumer": {
        "growth_range": (0.07, 0.16),
        "margin_range": (0.16, 0.28),
        "ev_ebitda_range": (8, 12),
        "gics": "Consumer Discretionary",
    },
    "Financial Services": {
        "growth_range": (0.08, 0.16),
        "margin_range": (0.22, 0.35),
        "ev_ebitda_range": (9, 13),
        "gics": "Financials",
    },
    "Energy": {
        "growth_range": (0.05, 0.14),
        "margin_range": (0.18, 0.32),
        "ev_ebitda_range": (6, 10),
        "gics": "Energy",
    },
}

GEOGRAPHIES = ["North America", "Europe", "Asia Pacific"]
GEO_COUNTRIES: Dict[str, List[str]] = {
    "North America": ["USA", "Canada"],
    "Europe": ["UK", "Germany", "France", "Netherlands", "Sweden"],
    "Asia Pacific": ["Australia", "Japan", "Singapore"],
}

EXIT_TYPES = ["Strategic Sale", "IPO", "Secondary Buyout", "Management Buyout"]

# Realistic company name components by sector
COMPANY_NAMES: Dict[str, List[str]] = {
    "Technology": [
        "Apex Systems", "Nexus Technologies", "CoreLogic Solutions", "Vertex Analytics",
        "Sigma Cloud", "Prism Software", "Catalyst Digital", "Summit Data", "Zenith AI",
        "Polaris Tech", "Aurora Platforms", "Helix Networks", "Nova Systems", "Orion Software",
        "Quantum Computing Co",
    ],
    "Healthcare": [
        "BioMedica Partners", "ClearPath Health", "Meridian Medical", "Precision Diagnostics",
        "LifeScience Holdings", "Vanguard Therapeutics", "CarePath Solutions", "Nexgen Pharma",
        "Align Health", "Summit Wellness", "PharmaTech Group", "MedCore Systems",
        "BrightCare Clinics", "Genesis BioTech", "Pulsar Medical",
    ],
    "Industrials": [
        "Atlas Manufacturing", "Frontier Engineering", "Titan Industrial", "Sterling Components",
        "Apex Precision", "Broadline Industries", "Crestwood Manufacturing", "Delta Fabrication",
        "Empire Automation", "Forged Solutions", "Granite Industrial", "Harbor Equipment",
        "Ironclad Systems", "Junction Works", "Keystone Manufacturing",
    ],
    "Consumer": [
        "Lifestyle Brands Co", "Peak Retail Group", "Evergreen Consumer", "Mosaic Brands",
        "Solstice Apparel", "Zenith Retail", "Crestline Foods", "Harvest Consumer",
        "Iconic Brands", "Journey Retail", "Kindle Consumer Goods", "Luminary Brands",
        "Maple Retail Group", "Noble Consumer", "Oakwood Brands",
    ],
    "Financial Services": [
        "Meridian Capital Partners", "Apex Financial Group", "Summit Wealth Management",
        "Clearwater Insurance", "Horizon Asset Management", "Benchmark Financial",
        "Cardinal FinTech", "Delphi Payments", "Equinox Credit", "Frontier Lending",
        "Gateway FinServ", "Harbor Financial", "Inspire Wealth", "Junction Capital",
        "Keystone Financial",
    ],
    "Energy": [
        "Solaris Energy", "GreenGrid Power", "Apex Renewables", "Summit Energy Partners",
        "Vertex Power Systems", "Clearfield Energy", "Dakota Resources", "Emerald Power",
        "Falcon Energy", "GreenBridge Utilities", "Horizon Renewables", "Ironstone Energy",
        "Junction Power", "Keystone Energy", "Luminary Power",
    ],
}

MANAGEMENT_FIRST_NAMES = [
    "James", "Sarah", "Michael", "Emily", "Robert", "Jennifer", "David", "Lisa",
    "William", "Karen", "Richard", "Nancy", "Thomas", "Sandra", "Charles", "Betty",
    "Christopher", "Helen", "Daniel", "Dorothy", "Matthew", "Sharon", "Anthony", "Donna",
    "Mark", "Carol", "Donald", "Ruth", "Steven", "Jessica",
]

MANAGEMENT_LAST_NAMES = [
    "Anderson", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
    "Moore", "Taylor", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
    "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker",
    "Hall", "Allen", "Young", "Hernandez", "King", "Wright",
]

NEWS_SOURCES = ["Bloomberg", "Reuters", "Financial Times", "Wall Street Journal", "PE Hub", "Pitchbook"]


# ---------------------------------------------------------------------------
# DataGenerator
# ---------------------------------------------------------------------------

class DataGenerator:
    """Generates a realistic synthetic PE portfolio dataset."""

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)
        random.seed(seed)
        self._company_counter = 0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(self) -> Dict[str, Any]:
        funds_def = [
            {
                "id": "fund_001",
                "name": "Meridian Capital Fund I",
                "vintage_year": 2017,
                "committed_capital": 800.0,
                "strategy": "Mid-Market Buyout",
                "num_exited": 8,
                "num_active": 7,
            },
            {
                "id": "fund_002",
                "name": "Meridian Capital Fund II",
                "vintage_year": 2020,
                "committed_capital": 1200.0,
                "strategy": "Mid-Market Buyout",
                "num_exited": 3,
                "num_active": 12,
            },
            {
                "id": "fund_003",
                "name": "Meridian Capital Fund III",
                "vintage_year": 2022,
                "committed_capital": 1500.0,
                "strategy": "Growth Buyout",
                "num_exited": 0,
                "num_active": 15,
            },
        ]

        all_companies: List[Dict[str, Any]] = []
        funds: List[Dict[str, Any]] = []

        for fund_def in funds_def:
            companies = self._generate_fund_companies(fund_def)
            all_companies.extend(companies)
            fund_summary = self._build_fund_summary(fund_def, companies)
            funds.append(fund_summary)

        portfolio_summary = self._build_portfolio_summary(all_companies, funds)

        return {
            "companies": all_companies,
            "funds": funds,
            "portfolio_summary": portfolio_summary,
        }

    # ------------------------------------------------------------------
    # Fund-level helpers
    # ------------------------------------------------------------------

    def _generate_fund_companies(self, fund_def: Dict[str, Any]) -> List[Dict[str, Any]]:
        companies = []
        vintage = fund_def["vintage_year"]

        # Assign sector distribution
        sectors_pool = self._make_sector_pool(fund_def["num_exited"] + fund_def["num_active"])

        geo_pool = self._make_geo_pool(fund_def["num_exited"] + fund_def["num_active"])

        # Exited companies first
        for i in range(fund_def["num_exited"]):
            sector = sectors_pool[i]
            geo = geo_pool[i]
            company = self._generate_company(
                fund_def=fund_def,
                sector=sector,
                geography=geo,
                status="exited",
                vintage=vintage,
            )
            companies.append(company)

        # Active companies
        for i in range(fund_def["num_active"]):
            sector = sectors_pool[fund_def["num_exited"] + i]
            geo = geo_pool[fund_def["num_exited"] + i]
            company = self._generate_company(
                fund_def=fund_def,
                sector=sector,
                geography=geo,
                status="active",
                vintage=vintage,
            )
            companies.append(company)

        return companies

    def _make_sector_pool(self, n: int) -> List[str]:
        """Create a balanced sector pool."""
        base = []
        for s in SECTORS:
            base.append(s)
        pool = base.copy()
        while len(pool) < n:
            pool.append(SECTORS[self.rng.integers(0, len(SECTORS))])
        self.rng.shuffle(pool)
        return pool[:n]

    def _make_geo_pool(self, n: int) -> List[str]:
        """Create a geography pool weighted to North America."""
        weights = [0.55, 0.30, 0.15]
        pool = self.rng.choice(GEOGRAPHIES, size=n, p=weights).tolist()
        return pool

    # ------------------------------------------------------------------
    # Company generation
    # ------------------------------------------------------------------

    def _generate_company(
        self,
        fund_def: Dict[str, Any],
        sector: str,
        geography: str,
        status: str,
        vintage: int,
    ) -> Dict[str, Any]:
        self._company_counter += 1
        comp_id = f"comp_{self._company_counter:03d}"

        sec_params = SECTOR_PARAMS[sector]
        country = random.choice(GEO_COUNTRIES[geography])

        # Entry date: 1-3 years after fund vintage
        entry_year = vintage + int(self.rng.integers(1, 4))
        entry_month = int(self.rng.integers(1, 13))
        entry_day = int(self.rng.integers(1, 28))
        entry_date_obj = date(entry_year, entry_month, entry_day)
        entry_date_str = entry_date_obj.strftime("%Y-%m-%d")

        # Entry financials
        entry_revenue = float(self.rng.uniform(50, 450))
        entry_margin = float(self.rng.uniform(*sec_params["margin_range"]))
        entry_ebitda = round(entry_revenue * entry_margin, 1)
        entry_ev_ebitda = float(self.rng.uniform(*sec_params["ev_ebitda_range"]))
        entry_ev = round(entry_ebitda * entry_ev_ebitda, 1)
        entry_leverage = float(self.rng.uniform(3.0, 5.5))
        entry_net_debt = round(entry_ebitda * entry_leverage, 1)

        # Growth rate
        annual_growth = float(self.rng.uniform(*sec_params["growth_range"]))

        today = date.today()

        if status == "exited":
            # Holding period 3-6 years
            holding_years = float(self.rng.uniform(3.0, 6.5))
            exit_date_obj = entry_date_obj + timedelta(days=int(holding_years * 365))
            if exit_date_obj > today:
                exit_date_obj = today - timedelta(days=180)
            # Ensure exit is not before entry (can happen if entry itself is recent)
            if exit_date_obj <= entry_date_obj:
                exit_date_obj = entry_date_obj + timedelta(days=365)
            exit_date_str = exit_date_obj.strftime("%Y-%m-%d")
            holding_period = max(0.25, (exit_date_obj - entry_date_obj).days / 365.25)

            # Build financials up to exit — range always has at least one year
            years_range = list(range(entry_date_obj.year, exit_date_obj.year + 1))
            exit_type = random.choice(EXIT_TYPES)
            exit_ev_ebitda = float(self.rng.uniform(*sec_params["ev_ebitda_range"])) * float(self.rng.uniform(0.95, 1.25))
            exit_moic = float(self.rng.uniform(1.5, 4.5))
            current_nav = entry_ev * exit_moic
            exit_ev = current_nav
        else:
            # For active companies clamp entry to at most today so range is valid
            if entry_date_obj > today:
                entry_date_obj = today - timedelta(days=90)
                entry_date_str = entry_date_obj.strftime("%Y-%m-%d")
            holding_period = max(0.08, (today - entry_date_obj).days / 365.25)
            exit_date_str = None
            exit_type = None
            exit_moic = None
            years_range = list(range(entry_date_obj.year, today.year + 1))

            # Active MOIC: 0.8x to 3.0x depending on how long held
            moic_factor = 1.0 + (annual_growth * 1.5 * holding_period)
            moic_factor = max(0.75, min(moic_factor, 3.5))
            current_nav = round(entry_ev * float(self.rng.uniform(moic_factor * 0.85, moic_factor * 1.15)), 1)
            exit_ev = None

        # Build financial history
        financials = self._build_financials(
            entry_revenue, entry_margin, entry_ev, entry_net_debt,
            entry_date_obj.year, years_range, annual_growth, sec_params, status
        )

        # Compute KPIs — fall back to entry values if history is somehow empty
        rev_list = financials["revenue"] or [entry_revenue]
        ebitda_list = financials["ebitda"] or [entry_ebitda]
        val_list = financials["valuation"] or [entry_ev]
        if not financials["net_debt"]:
            financials["net_debt"] = [entry_net_debt]

        if len(rev_list) >= 2 and rev_list[-2] > 0:
            revenue_growth_ttm = (rev_list[-1] - rev_list[-2]) / rev_list[-2]
        else:
            revenue_growth_ttm = annual_growth

        ebitda_margin_current = ebitda_list[-1] / rev_list[-1] if rev_list[-1] > 0 else entry_margin
        moic_current = current_nav / entry_ev if entry_ev > 0 else 1.0
        net_debt_current = financials["net_debt"][-1]
        ev_ebitda_current = val_list[-1] / ebitda_list[-1] if ebitda_list[-1] > 0 else entry_ev_ebitda
        net_debt_ebitda = net_debt_current / ebitda_list[-1] if ebitda_list[-1] > 0 else entry_leverage

        name = self._pick_company_name(sector)

        kpis = {
            "revenue_growth_ttm": round(revenue_growth_ttm, 4),
            "ebitda_margin": round(ebitda_margin_current, 4),
            "ev_ebitda_current": round(ev_ebitda_current, 2),
            "net_debt_ebitda": round(net_debt_ebitda, 2),
            "moic_current": round(moic_current, 2),
            "current_nav": round(current_nav, 1),
        }

        swot = self._generate_swot({"name": name, "sector": sector, "kpis": kpis, "geography": geography})

        peers = self._generate_peers(sector, sec_params)

        news = self._generate_news(name, sector)

        management = self._generate_management()

        description = self._generate_description(name, sector, geography, kpis)
        thesis = self._generate_thesis(name, sector, entry_ev_ebitda, annual_growth)

        company: Dict[str, Any] = {
            "id": comp_id,
            "name": name,
            "fund": fund_def["name"],
            "fund_id": fund_def["id"],
            "vintage_year": vintage,
            "sector": sector,
            "gics_sector": sec_params["gics"],
            "geography": geography,
            "country": country,
            "entry_date": entry_date_str,
            "entry_ev": round(entry_ev, 1),
            "entry_ebitda": round(entry_ebitda, 1),
            "entry_revenue": round(entry_revenue, 1),
            "entry_leverage": round(entry_leverage, 2),
            "entry_ev_ebitda": round(entry_ev_ebitda, 2),
            "status": status,
            "holding_period": round(holding_period, 2),
            "exit_date": exit_date_str,
            "exit_ev": round(exit_ev, 1) if exit_ev is not None else None,
            "exit_moic": round(exit_moic, 2) if exit_moic is not None else None,
            "exit_type": exit_type,
            "current_nav": round(current_nav, 1),
            "moic_current": round(moic_current, 2),
            "revenue_growth": round(revenue_growth_ttm, 4),
            "ebitda_margin": round(ebitda_margin_current, 4),
            "description": description,
            "investment_thesis": thesis,
            "management": management,
            "financials": financials,
            "kpis": kpis,
            "swot": swot,
            "peers": peers,
            "news": news,
        }

        return company

    # ------------------------------------------------------------------
    # Financial history builder
    # ------------------------------------------------------------------

    def _build_financials(
        self,
        entry_revenue: float,
        entry_margin: float,
        entry_ev: float,
        entry_net_debt: float,
        start_year: int,
        years_range: List[int],
        annual_growth: float,
        sec_params: Dict[str, Any],
        status: str,
    ) -> Dict[str, Any]:
        years = years_range
        revenues = []
        ebitdas = []
        valuations = []
        net_debts = []

        rev = entry_revenue
        margin = entry_margin
        nd = entry_net_debt
        ev = entry_ev

        for i, yr in enumerate(years):
            if i == 0:
                revenues.append(round(rev, 1))
                ebitdas.append(round(rev * margin, 1))
                valuations.append(round(ev, 1))
                net_debts.append(round(nd, 1))
            else:
                noise = float(self.rng.uniform(-0.02, 0.02))
                rev = rev * (1 + annual_growth + noise)
                # Margin expansion over time (slight)
                margin = min(margin + float(self.rng.uniform(0.0, 0.015)), sec_params["margin_range"][1])
                ebitda = rev * margin
                multiple = float(self.rng.uniform(*sec_params["ev_ebitda_range"]))
                ev_new = ebitda * multiple
                # Net debt amortizes ~8-12% per year
                nd = max(0, nd * float(self.rng.uniform(0.88, 0.93)))

                revenues.append(round(rev, 1))
                ebitdas.append(round(ebitda, 1))
                valuations.append(round(ev_new, 1))
                net_debts.append(round(nd, 1))

        # Compute growth rates and margins
        rev_growth = []
        for i in range(len(revenues)):
            if i == 0:
                rev_growth.append(0.0)
            else:
                g = (revenues[i] - revenues[i - 1]) / revenues[i - 1] if revenues[i - 1] > 0 else 0.0
                rev_growth.append(round(g, 4))

        ebitda_margins = [round(ebitdas[i] / revenues[i], 4) if revenues[i] > 0 else 0.0 for i in range(len(revenues))]

        return {
            "years": years,
            "revenue": revenues,
            "ebitda": ebitdas,
            "valuation": valuations,
            "net_debt": net_debts,
            "revenue_growth": rev_growth,
            "ebitda_margin": ebitda_margins,
        }

    # ------------------------------------------------------------------
    # Fund summary builder
    # ------------------------------------------------------------------

    def _build_fund_summary(self, fund_def: Dict[str, Any], companies: List[Dict[str, Any]]) -> Dict[str, Any]:
        committed = fund_def["committed_capital"]
        deployed = sum(c["entry_ev"] * 0.4 for c in companies)  # equity ~40% of EV
        deployed = min(deployed, committed * 0.95)

        nav = sum(c["current_nav"] * 0.4 for c in companies if c["status"] == "active")

        # Realised from exits
        realised = sum(
            c["exit_moic"] * c["entry_ev"] * 0.4
            for c in companies
            if c["status"] == "exited" and c["exit_moic"] is not None
        )

        dpi = realised / deployed if deployed > 0 else 0.0
        rvpi = nav / deployed if deployed > 0 else 0.0
        tvpi = dpi + rvpi

        num_exits = sum(1 for c in companies if c["status"] == "exited")

        return {
            "id": fund_def["id"],
            "name": fund_def["name"],
            "vintage_year": fund_def["vintage_year"],
            "strategy": fund_def["strategy"],
            "committed_capital": round(committed, 1),
            "deployed_capital": round(deployed, 1),
            "nav": round(nav, 1),
            "dpi": round(dpi, 3),
            "tvpi": round(tvpi, 3),
            "rvpi": round(rvpi, 3),
            "num_companies": len(companies),
            "num_exits": num_exits,
            "companies": [c["id"] for c in companies],
        }

    # ------------------------------------------------------------------
    # Portfolio summary
    # ------------------------------------------------------------------

    def _build_portfolio_summary(self, companies: List[Dict[str, Any]], funds: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_nav = sum(c["current_nav"] for c in companies if c["status"] == "active")
        total_deployed = sum(f["deployed_capital"] for f in funds)
        total_realised = sum(
            c["exit_moic"] * c["entry_ev"] * 0.4
            for c in companies
            if c["status"] == "exited" and c["exit_moic"] is not None
        )

        mean_moic = float(np.mean([c["moic_current"] for c in companies]))
        num_active = sum(1 for c in companies if c["status"] == "active")
        num_exited = sum(1 for c in companies if c["status"] == "exited")

        # MOIC distribution bins
        moic_values = [c["moic_current"] for c in companies]
        bins = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 99]
        moic_distribution = []
        for i in range(len(bins) - 1):
            label = f"{bins[i]:.1f}x-{bins[i+1]:.1f}x" if bins[i + 1] < 99 else f">{bins[i]:.1f}x"
            count = sum(1 for m in moic_values if bins[i] <= m < bins[i + 1])
            moic_distribution.append({"range": label, "count": count})

        # NAV history (last 6 years)
        current_year = 2024
        nav_history = []
        base_nav = total_nav
        for yr in range(current_year - 5, current_year + 1):
            factor = ((yr - (current_year - 5)) / 5) ** 1.5 * 0.85 + 0.15
            nav_history.append({"year": yr, "nav": round(base_nav * factor, 1)})

        # Exit histogram
        exited_companies = [c for c in companies if c["status"] == "exited"]
        holding_bins = [0, 2, 3, 4, 5, 6, 8]
        exit_histogram = []
        for i in range(len(holding_bins) - 1):
            lo, hi = holding_bins[i], holding_bins[i + 1]
            label = f"{lo}-{hi}y"
            count = sum(1 for c in exited_companies if lo <= c["holding_period"] < hi)
            exit_histogram.append({"bucket": label, "count": count})

        # Fund breakdown
        fund_breakdown = []
        for f in funds:
            fund_companies = [c for c in companies if c["fund_id"] == f["id"]]
            fund_nav = sum(c["current_nav"] for c in fund_companies if c["status"] == "active")
            fund_breakdown.append({
                "fund_id": f["id"],
                "fund_name": f["name"],
                "nav": round(fund_nav, 1),
                "tvpi": f["tvpi"],
                "dpi": f["dpi"],
                "num_companies": len(fund_companies),
            })

        return {
            "portfolio_nav": round(total_nav, 1),
            "total_deployed": round(total_deployed, 1),
            "total_realised": round(total_realised, 1),
            "expected_dpi": round(total_realised / total_deployed if total_deployed > 0 else 0, 3),
            "expected_tvpi": round((total_nav + total_realised) / total_deployed if total_deployed > 0 else 0, 3),
            "exits_next_24m": num_active // 4,
            "liquidity_forecast": round(total_nav * 0.3, 1),
            "mean_moic": round(mean_moic, 2),
            "num_active": num_active,
            "num_exited": num_exited,
            "num_companies": len(companies),
            "nav_history": nav_history,
            "moic_distribution": moic_distribution,
            "exit_histogram": exit_histogram,
            "fund_breakdown": fund_breakdown,
        }

    # ------------------------------------------------------------------
    # SWOT generator
    # ------------------------------------------------------------------

    def _generate_swot(self, company: Dict[str, Any]) -> Dict[str, List[str]]:
        sector = company.get("sector", "Technology")
        name = company.get("name", "Company")

        sector_strengths: Dict[str, List[str]] = {
            "Technology": [
                f"Market-leading SaaS platform with {int(self.rng.uniform(75, 95))}% recurring revenue",
                "Strong IP portfolio with 15+ patents protecting core technology",
                f"Net revenue retention of {int(self.rng.uniform(110, 135))}% reflecting strong product-market fit",
                "Scaled go-to-market with enterprise sales motion",
            ],
            "Healthcare": [
                "Proprietary clinical protocols delivering superior patient outcomes",
                f"Long-term contracts with {int(self.rng.uniform(20, 60))} hospital systems",
                "Regulatory approvals providing significant barriers to entry",
                "Mission-critical workflow integration across care settings",
            ],
            "Industrials": [
                "Diversified blue-chip customer base with low single-customer concentration",
                f"ISO-certified manufacturing with {int(self.rng.uniform(95, 99))}% on-time delivery",
                "Proprietary production processes driving cost advantage",
                "Long-standing supplier relationships limiting input cost volatility",
            ],
            "Consumer": [
                "Strong brand recognition with high Net Promoter Score",
                f"Loyal customer base with {int(self.rng.uniform(55, 75))}% repeat purchase rate",
                "Multi-channel distribution spanning digital and physical retail",
                "Product differentiation supported by proprietary formulations",
            ],
            "Financial Services": [
                "Scalable technology platform with low marginal cost per transaction",
                f"Regulatory licenses in {int(self.rng.uniform(8, 25))} jurisdictions",
                "Deep integration with enterprise customers driving high switching costs",
                "Strong compliance infrastructure and risk management framework",
            ],
            "Energy": [
                "Long-term power purchase agreements providing revenue visibility",
                "Diversified asset portfolio across geographies and technologies",
                "Experienced operational team with proven project delivery track record",
                "Favourable positioning in growing renewable energy market",
            ],
        }

        sector_weaknesses: Dict[str, List[str]] = {
            "Technology": [
                "Customer concentration with top 5 clients representing 35% of revenue",
                "Limited international presence outside North America",
                "Sales cycle elongation risk in enterprise segment",
                "Management depth below C-suite requires investment",
            ],
            "Healthcare": [
                "Reimbursement rate exposure to government policy changes",
                "High cost of regulatory compliance in new markets",
                "Physician adoption curve limiting near-term growth",
                "Geographic concentration in existing markets",
            ],
            "Industrials": [
                "Revenue cyclicality tied to broader industrial capex cycles",
                "Working capital intensity limiting free cash flow conversion",
                "Skilled labour availability in key manufacturing locations",
                "Commodity input cost sensitivity",
            ],
            "Consumer": [
                "Brand refresh required to attract younger demographic cohorts",
                "DTC channel underdeveloped relative to peers",
                "Margin pressure from rising logistics and input costs",
                "Dependence on third-party retail partners for distribution",
            ],
            "Financial Services": [
                "Regulatory capital requirements constraining balance sheet growth",
                "Sensitivity to interest rate cycle on net interest margin",
                "Technology legacy infrastructure requiring modernisation investment",
                "Talent competition from technology sector for engineering resources",
            ],
            "Energy": [
                "Project development pipeline subject to permitting timelines",
                "Merchant price exposure for a portion of generation capacity",
                "High capital expenditure requirements for asset expansion",
                "Grid interconnection constraints in target markets",
            ],
        }

        sector_opportunities: Dict[str, List[str]] = {
            "Technology": [
                "International expansion into EMEA and APAC markets",
                "AI/ML product layer to drive premium pricing and NRR expansion",
                "Platform adjacencies to increase TAM by 3-4x",
                "Strategic M&A of complementary point solutions",
            ],
            "Healthcare": [
                "Value-based care transition creating demand for outcomes analytics",
                "International market entry in European healthcare systems",
                "Service line expansion into adjacent care settings",
                "Digital health integration to enhance patient experience",
            ],
            "Industrials": [
                "Reshoring trends driving demand from domestic manufacturers",
                "Automation and robotics investment enhancing margin profile",
                "Service and aftermarket revenue stream expansion",
                "Bolt-on acquisition opportunities in fragmented market",
            ],
            "Consumer": [
                "International market expansion targeting high-growth regions",
                "Direct-to-consumer channel development improving margins",
                "Product line extensions into adjacent categories",
                "Sustainability positioning resonating with evolving consumer preferences",
            ],
            "Financial Services": [
                "Embedded finance partnerships with non-financial platforms",
                "Geographic expansion into underserved markets",
                "Product innovation leveraging open banking infrastructure",
                "SME market segment offering significant headroom for growth",
            ],
            "Energy": [
                "IRA incentives accelerating renewable energy deployment economics",
                "Corporate PPA demand from large technology and industrial customers",
                "Battery storage integration enhancing asset value",
                "International development opportunities in emerging markets",
            ],
        }

        sector_threats: Dict[str, List[str]] = {
            "Technology": [
                "Intensifying competitive landscape from well-funded point solutions",
                "Hyperscaler platform risk from cloud providers entering adjacent markets",
                "Macroeconomic sensitivity of enterprise software spending",
                "Cybersecurity and data privacy regulatory evolution",
            ],
            "Healthcare": [
                "Medicare and Medicaid reimbursement rate pressure",
                "Consolidation among hospital systems increasing buyer power",
                "Clinical evidence requirements raising time-to-market timelines",
                "Workforce shortages increasing labour cost across care settings",
            ],
            "Industrials": [
                "Global supply chain disruption risk affecting input availability",
                "Near-shoring by multinational customers impacting geographic demand mix",
                "Sustainability regulation requiring capital investment in green manufacturing",
                "New market entrants from low-cost geographies",
            ],
            "Consumer": [
                "Macroeconomic consumer spending slowdown risk",
                "E-commerce channel shift disrupting traditional retail distribution",
                "Raw material cost inflation compressing margins",
                "Competitive private label expansion by major retailers",
            ],
            "Financial Services": [
                "Interest rate normalisation impacting funding costs",
                "FinTech disruption from well-capitalised new entrants",
                "Regulatory tightening in consumer lending markets",
                "Credit cycle deterioration in economic downturn scenario",
            ],
            "Energy": [
                "Policy uncertainty around renewable energy incentive programmes",
                "Grid infrastructure constraints limiting capacity expansion",
                "Supply chain cost inflation for key components",
                "Interest rate sensitivity on project finance economics",
            ],
        }

        strengths = sector_strengths.get(sector, ["Strong competitive position", "Experienced management team"])[:2]
        weaknesses = sector_weaknesses.get(sector, ["Concentration risk", "Management depth"])[:2]
        opportunities = sector_opportunities.get(sector, ["International expansion", "Adjacent markets"])[:2]
        threats = sector_threats.get(sector, ["Competitive pressure", "Regulatory risk"])[:2]

        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "threats": threats,
        }

    # ------------------------------------------------------------------
    # Business plan generator
    # ------------------------------------------------------------------

    def _generate_business_plan(self, company: Dict[str, Any]) -> Dict[str, Any]:
        name = company.get("name", "Company")
        sector = company.get("sector", "Technology")
        kpis = company.get("kpis", {})
        nav = kpis.get("current_nav", company.get("current_nav", 500))
        moic = kpis.get("moic_current", company.get("moic_current", 2.0))
        margin = kpis.get("ebitda_margin", company.get("ebitda_margin", 0.25))
        growth = kpis.get("revenue_growth_ttm", company.get("revenue_growth", 0.12))

        exec_summary = (
            f"{name} is a {sector.lower()} sector portfolio company with a current enterprise value of "
            f"${nav:.0f}M and a MOIC of {moic:.1f}x. The business has demonstrated consistent revenue growth "
            f"of {growth*100:.1f}% and EBITDA margins of {margin*100:.1f}%, underpinned by a strong competitive "
            f"moat and differentiated product offering. Management is executing against a clear value creation "
            f"roadmap targeting a 3.0-4.0x return at exit."
        )

        market_positioning = (
            f"{name} occupies a leadership position in its core {sector} vertical, benefiting from "
            f"high switching costs and deep customer relationships. The company's proprietary technology "
            f"and operational capabilities differentiate it from competitors and support premium pricing. "
            f"Market share expansion is targeted through organic growth initiatives and selective M&A."
        )

        growth_strategy = (
            f"The primary growth vectors for {name} include: (1) geographic expansion into underpenetrated "
            f"markets, targeting {int(self.rng.uniform(2, 5))} new territories over 24 months; "
            f"(2) product line extension leveraging the existing customer base; and (3) strategic "
            f"partnerships to access adjacent channels. Revenue growth of {int((growth + 0.05) * 100)}-"
            f"{int((growth + 0.12) * 100)}% per annum is targeted over the hold period."
        )

        operational_initiatives = (
            f"Operational value creation priorities include: margin improvement through procurement "
            f"optimisation and operational efficiency initiatives targeting {int(margin * 100 + 3)}-"
            f"{int(margin * 100 + 6)}% EBITDA margins; implementation of data-driven KPI frameworks; "
            f"leadership team enhancement with {int(self.rng.uniform(2, 4))} senior hires planned; "
            f"and technology infrastructure investment to support scale."
        )

        value_creation_plan = (
            f"The value creation plan targets a {max(moic * 1.3, 3.0):.1f}x-{max(moic * 1.6, 3.5):.1f}x MOIC "
            f"through a combination of revenue growth, margin expansion, and multiple expansion. "
            f"EBITDA is expected to grow from the current level to approximately ${kpis.get('current_nav', nav) * margin * 1.5:.0f}M "
            f"at exit, driven by organic growth and bolt-on acquisitions. Financial leverage will be "
            f"managed to optimise equity returns while maintaining investment-grade credit metrics."
        )

        exit_strategy = (
            f"The preferred exit pathway for {name} is a strategic sale to a sector-focused acquirer "
            f"or large-cap consolidator, with IPO as a secondary option given the company's scale and "
            f"growth profile. A secondary buyout to a large-cap PE fund represents an alternative "
            f"path. The target exit window is {int(self.rng.uniform(2, 4))} years, targeting an EV/EBITDA "
            f"multiple of {float(self.rng.uniform(10, 15)):.1f}x-{float(self.rng.uniform(14, 18)):.1f}x."
        )

        timeline = {
            "year_1": ["Complete management team build-out", "Implement performance management framework", "Initiate geographic expansion planning"],
            "year_2": ["Launch new market entry", "Complete first bolt-on acquisition", "Achieve EBITDA margin target"],
            "year_3": ["Consolidate market position", "Initiate exit preparation process", "Engage advisors for sale process"],
            "year_4": ["Execute exit transaction", "Realise full value creation plan"],
        }

        return {
            "company_id": company.get("id", ""),
            "executive_summary": exec_summary,
            "market_positioning": market_positioning,
            "growth_strategy": growth_strategy,
            "operational_initiatives": operational_initiatives,
            "value_creation_plan": value_creation_plan,
            "exit_strategy": exit_strategy,
            "timeline": timeline,
        }

    # ------------------------------------------------------------------
    # Helper generators
    # ------------------------------------------------------------------

    def _pick_company_name(self, sector: str) -> str:
        names = COMPANY_NAMES.get(sector, COMPANY_NAMES["Technology"])
        idx = int(self.rng.integers(0, len(names)))
        # Add a suffix to prevent duplicate names across sectors
        suffix_options = ["", " Group", " Holdings", " Partners", " Corp", " Inc"]
        suffix = suffix_options[int(self.rng.integers(0, len(suffix_options)))]
        return names[idx] + suffix

    def _generate_management(self) -> List[Dict[str, Any]]:
        titles = ["CEO", "CFO", "COO"]
        mgmt = []
        for title in titles:
            first = MANAGEMENT_FIRST_NAMES[int(self.rng.integers(0, len(MANAGEMENT_FIRST_NAMES)))]
            last = MANAGEMENT_LAST_NAMES[int(self.rng.integers(0, len(MANAGEMENT_LAST_NAMES)))]
            tenure = int(self.rng.integers(2, 14))
            mgmt.append({"name": f"{first} {last}", "title": title, "tenure": tenure})
        return mgmt

    def _generate_peers(self, sector: str, sec_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        peer_names = {
            "Technology": ["DataSphere Corp", "CloudAxis Inc", "TechPulse Group", "DigitalCore Partners"],
            "Healthcare": ["MedVantage Corp", "HealthBridge Group", "ClinPath Partners", "BioSynergy Inc"],
            "Industrials": ["PrecisionWorks Corp", "IndustrialPath Group", "MechCore Partners", "FabTech Inc"],
            "Consumer": ["BrandCraft Corp", "RetailPath Group", "LifestyleCore Partners", "ConsumerEdge Inc"],
            "Financial Services": ["FinPath Corp", "CapitalBridge Group", "WealthCore Partners", "FinTech Edge Inc"],
            "Energy": ["PowerPath Corp", "EnergyBridge Group", "GreenCore Partners", "RenewEdge Inc"],
        }
        names = peer_names.get(sector, peer_names["Technology"])
        peers = []
        for name in names[:3]:
            peers.append({
                "name": name,
                "ev_ebitda": round(float(self.rng.uniform(*sec_params["ev_ebitda_range"])), 1),
                "revenue_growth": round(float(self.rng.uniform(*sec_params["growth_range"])), 3),
                "ebitda_margin": round(float(self.rng.uniform(*sec_params["margin_range"])), 3),
            })
        return peers

    def _generate_news(self, name: str, sector: str) -> List[Dict[str, Any]]:
        templates = [
            {
                "title": f"{name} Reports Record Revenue Growth in Q3",
                "summary": f"{name} announced record quarterly revenue, driven by strong organic growth and recent product launches. Management raised full-year guidance for the third consecutive quarter.",
                "sentiment": "positive",
                "sentiment_score": round(float(self.rng.uniform(0.6, 0.9)), 2),
                "source": "Bloomberg",
            },
            {
                "title": f"{name} Completes Strategic Acquisition",
                "summary": f"{name} completed the acquisition of a complementary {sector} business, expanding its market reach and product capabilities. The transaction is expected to be immediately accretive to EBITDA.",
                "sentiment": "positive",
                "sentiment_score": round(float(self.rng.uniform(0.5, 0.8)), 2),
                "source": "Reuters",
            },
            {
                "title": f"Industry Analysts Upgrade {name} Outlook",
                "summary": f"Leading industry analysts upgraded their outlook for {name}, citing improving fundamentals and strong competitive positioning within the {sector} sector.",
                "sentiment": "positive",
                "sentiment_score": round(float(self.rng.uniform(0.55, 0.85)), 2),
                "source": "Financial Times",
            },
            {
                "title": f"{name} Expands Management Team with Senior Appointments",
                "summary": f"{name} announced the appointment of three senior executives to strengthen its leadership team ahead of the next phase of growth.",
                "sentiment": "neutral",
                "sentiment_score": round(float(self.rng.uniform(0.1, 0.4)), 2),
                "source": "PE Hub",
            },
            {
                "title": f"Macro Headwinds Weigh on {sector} Sector Outlook",
                "summary": f"Macro economic uncertainty is creating near-term headwinds for {sector} sector companies, including {name}. Management remains cautious on the near-term demand environment.",
                "sentiment": "negative",
                "sentiment_score": round(float(self.rng.uniform(-0.5, -0.1)), 2),
                "source": "Wall Street Journal",
            },
        ]

        # Pick 3 news items
        selected = self.rng.choice(len(templates), size=3, replace=False).tolist()
        news_items = []
        for i, idx in enumerate(selected):
            t = templates[idx]
            month = int(self.rng.integers(1, 13))
            day = int(self.rng.integers(1, 28))
            year = int(self.rng.integers(2023, 2025))
            news_items.append({
                "id": f"n{i+1}",
                "title": t["title"],
                "date": f"{year}-{month:02d}-{day:02d}",
                "source": t["source"],
                "summary": t["summary"],
                "sentiment": t["sentiment"],
                "sentiment_score": t["sentiment_score"],
            })

        return news_items

    def _generate_description(self, name: str, sector: str, geography: str, kpis: Dict[str, Any]) -> str:
        growth_pct = kpis.get("revenue_growth_ttm", 0.12) * 100
        margin_pct = kpis.get("ebitda_margin", 0.25) * 100
        nav = kpis.get("current_nav", 500)

        descriptions = {
            "Technology": (
                f"{name} is a leading {geography}-based software and technology company serving "
                f"enterprise clients across multiple verticals. The business generates approximately "
                f"${nav:.0f}M in enterprise value with {growth_pct:.0f}% revenue growth and "
                f"{margin_pct:.0f}% EBITDA margins driven by its scalable SaaS platform."
            ),
            "Healthcare": (
                f"{name} is a {geography}-headquartered healthcare services and technology company "
                f"providing mission-critical solutions to hospitals and health systems. "
                f"With {growth_pct:.0f}% revenue growth and {margin_pct:.0f}% EBITDA margins, "
                f"the company is well-positioned in the growing value-based care market."
            ),
            "Industrials": (
                f"{name} is a {geography}-based precision manufacturing and industrial services company "
                f"serving blue-chip customers across aerospace, automotive, and defence sectors. "
                f"The business has delivered consistent {growth_pct:.0f}% revenue growth with "
                f"{margin_pct:.0f}% EBITDA margins underpinned by proprietary production processes."
            ),
            "Consumer": (
                f"{name} is a {geography}-based consumer products and brands company with a portfolio "
                f"of differentiated products serving premium market segments. Revenue growth of "
                f"{growth_pct:.0f}% and {margin_pct:.0f}% EBITDA margins reflect strong brand equity "
                f"and effective multi-channel distribution strategy."
            ),
            "Financial Services": (
                f"{name} is a {geography}-based financial services technology company providing "
                f"software and data solutions to financial institutions globally. The business has "
                f"delivered {growth_pct:.0f}% revenue growth with {margin_pct:.0f}% EBITDA margins, "
                f"underpinned by recurring revenue and deep customer integration."
            ),
            "Energy": (
                f"{name} is a {geography}-based renewable energy platform developing and operating "
                f"solar, wind, and energy storage assets across multiple markets. Revenue growth of "
                f"{growth_pct:.0f}% and {margin_pct:.0f}% EBITDA margins reflect strong contracted "
                f"revenue and operational excellence."
            ),
        }

        return descriptions.get(sector, f"{name} is a leading {sector} company based in {geography}.")

    def _generate_thesis(self, name: str, sector: str, entry_ev_ebitda: float, annual_growth: float) -> str:
        theses = {
            "Technology": (
                f"Meridian invested in {name} at {entry_ev_ebitda:.1f}x EV/EBITDA, attracted by its "
                f"differentiated software platform and {annual_growth*100:.0f}%+ organic revenue growth. "
                f"The investment thesis centres on accelerating growth through product innovation, "
                f"international expansion, and strategic add-on acquisitions to build a market-leading platform."
            ),
            "Healthcare": (
                f"Meridian acquired {name} at {entry_ev_ebitda:.1f}x EV/EBITDA, recognising the company's "
                f"strong clinical outcomes and scalable care delivery model. The thesis centres on "
                f"expanding into new geographies, broadening the service offering, and capitalising on "
                f"the shift to value-based care to drive superior risk-adjusted returns."
            ),
            "Industrials": (
                f"Meridian invested in {name} at {entry_ev_ebitda:.1f}x EV/EBITDA, recognising its "
                f"best-in-class manufacturing capabilities and defensible customer relationships. "
                f"The value creation plan targets operational improvements, capacity expansion, "
                f"and consolidation of a fragmented market through bolt-on acquisitions."
            ),
            "Consumer": (
                f"Meridian acquired {name} at {entry_ev_ebitda:.1f}x EV/EBITDA, attracted by its "
                f"strong brand equity and loyal customer base with {annual_growth*100:.0f}%+ growth. "
                f"The investment thesis involves accelerating DTC channel development, "
                f"international market entry, and product line extension to drive multiple expansion."
            ),
            "Financial Services": (
                f"Meridian invested in {name} at {entry_ev_ebitda:.1f}x EV/EBITDA, attracted by its "
                f"scalable fintech platform and deep integration within financial institution workflows. "
                f"The thesis centres on product expansion, geographic growth, and leveraging the "
                f"open banking regulatory environment to capture significant market share."
            ),
            "Energy": (
                f"Meridian invested in {name} at {entry_ev_ebitda:.1f}x EV/EBITDA, recognising its "
                f"differentiated renewable energy asset portfolio and strong contracted revenue base. "
                f"The investment thesis centres on accelerating development pipeline execution, "
                f"battery storage integration, and capitalising on favourable policy tailwinds."
            ),
        }
        return theses.get(sector, f"Meridian invested in {name} at {entry_ev_ebitda:.1f}x EV/EBITDA to drive value creation.")

"""
Analytics Service - orchestrates data, models and business logic.

This is a singleton service with lazy-loaded ML models. All routers
should import and use the module-level `service` instance.
"""
from __future__ import annotations

import re
import datetime
import math
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Data & models
# ---------------------------------------------------------------------------

from data.synthetic_generator import get_data, DataGenerator
from models.survival_model import SurvivalModel
from models.moic_model import MOICModel
from models.monte_carlo import MonteCarloSimulator


# ---------------------------------------------------------------------------
# AnalyticsService
# ---------------------------------------------------------------------------

class AnalyticsService:
    """Singleton analytics service with lazy model loading."""

    _instance: Optional["AnalyticsService"] = None

    def __new__(cls) -> "AnalyticsService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialised = False
        return cls._instance

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _ensure_init(self) -> None:
        if self._initialised:
            return

        data = get_data()
        self._companies: List[Dict[str, Any]] = data["companies"]
        self._funds: List[Dict[str, Any]] = data["funds"]
        self._portfolio_summary: Dict[str, Any] = data["portfolio_summary"]

        # Fit models
        self._survival_model = SurvivalModel()
        self._survival_model.fit(self._companies)

        self._moic_model = MOICModel()
        self._moic_model.fit(self._companies)

        self._mc_simulator = MonteCarloSimulator(seed=42)

        self._data_generator = DataGenerator(seed=42)

        self._initialised = True

    # ------------------------------------------------------------------
    # Portfolio
    # ------------------------------------------------------------------

    def get_overview(self) -> Dict[str, Any]:
        self._ensure_init()
        summary = self._portfolio_summary
        current_year = datetime.date.today().year

        # ── Active company count ──────────────────────────────────────────
        active_companies = [c for c in self._companies if c["status"] == "active"]
        num_active = len(active_companies)

        # ── nav_evolution: [{year, nav, committed}] ───────────────────────
        nav_history = summary.get("nav_history", [])
        total_deployed = summary.get("total_deployed", 1.0)
        n = max(len(nav_history), 1)
        nav_evolution = [
            {
                "year": item["year"],
                "nav": item["nav"],
                "committed": round(total_deployed * min(1.0, (i + 1) / n), 1),
            }
            for i, item in enumerate(nav_history)
        ]

        # ── exit_timing: projected exits per calendar year ────────────────
        hazard_by_sector = self._survival_model.get_hazard_rates(self._companies, "sector")
        exit_timing = []
        for offset in range(6):
            yr = current_year + offset
            expected_exits = 0.0
            expected_proceeds = 0.0
            for c in active_companies:
                sector = c.get("sector", "Technology")
                hazard = hazard_by_sector.get(sector, 0.15)
                # Probability of exiting in this specific year: h * (1-h)^offset
                prob = hazard * ((1 - hazard) ** offset)
                expected_exits += prob
                expected_proceeds += prob * c.get("current_nav", 300) * 0.85
            exit_timing.append({
                "year": str(yr),
                "exits": round(expected_exits, 1),
                "proceeds": round(expected_proceeds),
            })

        # ── fund_performance: [{fund, vintage, nav, dpi, tvpi, irr, status}] ──
        fund_performance = []
        for f in self._funds:
            vintage = f["vintage_year"]
            years_held = max(1, current_year - vintage)
            tvpi = f.get("tvpi", 1.0)
            # Approximate IRR from TVPI and years held
            irr = round((tvpi ** (1.0 / years_held) - 1.0) * 100, 1)
            if vintage <= 2018:
                status = "Harvesting"
            elif vintage <= 2021:
                status = "Value Creation"
            else:
                status = "Investing"
            fund_performance.append({
                "fund": f["name"],
                "vintage": vintage,
                "committed": round(f.get("committed_capital", 0), 1),
                "nav": round(f["nav"], 1),
                "dpi": round(f["dpi"], 2),
                "tvpi": round(f["tvpi"], 2),
                "irr": irr,
                "status": status,
            })

        # ── cash_flow_fan: simplified MC fan chart ────────────────────────
        cash_flow_fan = []
        for i in range(1, 7):
            yr_factor = (i / 6) ** 0.8
            p50 = round(total_deployed * yr_factor * 1.8)
            spread = p50 * 0.35
            cash_flow_fan.append({
                "year": current_year + i,
                "p10": max(0, round(p50 - spread * 1.5)),
                "p25": max(0, round(p50 - spread * 0.7)),
                "p50": p50,
                "p75": round(p50 + spread * 0.7),
                "p90": round(p50 + spread * 1.5),
            })

        # ── moic_distribution: use "moic" key so chart XAxis resolves ─────
        raw_moic = summary.get("moic_distribution", [])
        moic_distribution = [
            {"moic": item.get("range", item.get("moic", "")), "count": item.get("count", 0)}
            for item in raw_moic
        ]

        return {
            "portfolio_nav": summary.get("portfolio_nav", 0.0),
            "expected_dpi": summary.get("expected_dpi", 0.0),
            "expected_tvpi": summary.get("expected_tvpi", 0.0),
            "active_companies": num_active,
            "exits_next_24m": summary.get("exits_next_24m", 0),
            "liquidity_forecast": summary.get("liquidity_forecast", 0.0),
            "nav_evolution": nav_evolution,
            "cash_flow_fan": cash_flow_fan,
            "exit_timing": exit_timing,
            "fund_performance": fund_performance,
            "moic_distribution": moic_distribution,
        }

    def get_portfolio(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        self._ensure_init()
        companies = list(self._companies)

        if not filters:
            return [self._to_company_summary(c) for c in companies]

        fund = filters.get("fund")
        sector = filters.get("sector")
        geography = filters.get("geography")
        vintage_year = filters.get("vintage_year")
        status = filters.get("status")
        min_nav = filters.get("min_nav")
        max_nav = filters.get("max_nav")

        result = []
        for c in companies:
            if fund and c.get("fund") != fund:
                continue
            if sector and c.get("sector") != sector:
                continue
            if geography and c.get("geography") != geography:
                continue
            if vintage_year and c.get("vintage_year") != vintage_year:
                continue
            if status and c.get("status") != status:
                continue
            nav = c.get("current_nav", 0.0)
            if min_nav is not None and nav < min_nav:
                continue
            if max_nav is not None and nav > max_nav:
                continue
            result.append(self._to_company_summary(c))

        return result

    def get_filter_options(self) -> Dict[str, Any]:
        self._ensure_init()
        return {
            "funds": sorted(set(c["fund"] for c in self._companies)),
            "sectors": sorted(set(c["sector"] for c in self._companies)),
            "geographies": sorted(set(c["geography"] for c in self._companies)),
            "vintage_years": sorted(set(c["vintage_year"] for c in self._companies)),
            "statuses": ["active", "exited"],
        }

    def get_portfolio_summary(self) -> Dict[str, Any]:
        self._ensure_init()
        return self._portfolio_summary

    # ------------------------------------------------------------------
    # Companies
    # ------------------------------------------------------------------

    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        for c in self._companies:
            if c["id"] == company_id:
                return self._to_company_detail(c)
        return None

    def get_financials(self, company_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        company = self._find_company(company_id)
        if not company:
            return None
        fin = company.get("financials", {})
        years = fin.get("years", [])
        revenues = fin.get("revenue", [])
        ebitdas = fin.get("ebitda", [])
        valuations = fin.get("valuation", [])
        rev_growth = fin.get("revenue_growth", [0.0] * len(years))
        ebitda_margins = fin.get("ebitda_margin", [0.25] * len(years))

        return {
            "years": years,
            "revenue": revenues,
            "ebitda": ebitdas,
            "valuation": valuations,
            "revenue_growth": rev_growth,
            "ebitda_margin": ebitda_margins,
        }

    def get_predictions(self, company_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        company = self._find_company(company_id)
        if not company:
            return None

        # Survival curve
        survival_curve = self._survival_model.predict_company(company)

        # Hazard rate
        sector = company.get("sector", "Technology")
        hazard_rates = self._survival_model.get_hazard_rates(self._companies, "sector")
        hazard_rate = hazard_rates.get(sector, 0.08)

        # MOIC predictions
        moic_preds = self._moic_model.predict(company)

        # Exit probability by year
        exit_probs = self._survival_model.get_exit_probability_by_year(company)

        # Risk indicators
        risk_indicators = self._compute_risk_indicators(company)

        return {
            "survival_curve": survival_curve,
            "hazard_rate": round(hazard_rate, 4),
            "moic_p10": moic_preds["p10"],
            "moic_p50": moic_preds["p50"],
            "moic_p90": moic_preds["p90"],
            "exit_probability_by_year": exit_probs,
            "risk_indicators": risk_indicators,
        }

    def get_news(self, company_id: str) -> List[Dict[str, Any]]:
        self._ensure_init()
        company = self._find_company(company_id)
        if not company:
            return []
        return company.get("news", [])

    def generate_business_plan(self, company_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        company = self._find_company(company_id)
        if not company:
            return None
        return self._data_generator._generate_business_plan(company)

    # ------------------------------------------------------------------
    # Funds
    # ------------------------------------------------------------------

    def get_funds(self) -> List[Dict[str, Any]]:
        self._ensure_init()
        return [self._to_fund_summary(f) for f in self._funds]

    def get_fund(self, fund_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        for f in self._funds:
            if f["id"] == fund_id:
                return self._to_fund_summary(f)
        return None

    def get_fund_analytics(self, fund_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        fund = self._find_fund(fund_id)
        if not fund:
            return None

        companies = [c for c in self._companies if c["fund_id"] == fund_id]
        if not companies:
            return None

        vintage = fund.get("vintage_year", 2018)
        current_year = 2024
        deployed = fund.get("deployed_capital", 1.0)

        # NAV history
        nav_history = self._build_nav_history(companies, vintage, current_year)

        # DPI trajectory
        dpi_trajectory = self._build_dpi_trajectory(companies, fund, vintage, current_year)

        # TVPI trajectory
        tvpi_trajectory = self._build_tvpi_trajectory(nav_history, dpi_trajectory, deployed)

        # Cashflow timeline
        cashflow_timeline = self._build_cashflow_timeline(companies, vintage, current_year)

        # Company breakdown
        company_breakdown = [
            {
                "company_id": c["id"],
                "name": c["name"],
                "nav": c.get("current_nav", 0.0),
                "moic": c.get("moic_current", 1.0),
                "status": c.get("status", "active"),
            }
            for c in companies
        ]

        return {
            "fund_id": fund_id,
            "nav_history": nav_history,
            "dpi_trajectory": dpi_trajectory,
            "tvpi_trajectory": tvpi_trajectory,
            "cashflow_timeline": cashflow_timeline,
            "company_breakdown": company_breakdown,
        }

    def get_monte_carlo(self, fund_id: str, n_simulations: int = 500) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        fund = self._find_fund(fund_id)
        if not fund:
            return None

        companies = [c for c in self._companies if c["fund_id"] == fund_id]
        result = self._mc_simulator.run(
            fund_id=fund_id,
            companies=companies,
            fund_meta=fund,
            n_simulations=n_simulations,
        )
        return result

    # ------------------------------------------------------------------
    # Survival analysis
    # ------------------------------------------------------------------

    def get_survival_data(self, group_by: str = "sector") -> Dict[str, Any]:
        self._ensure_init()
        km_curves_dict = self._survival_model.get_km_curves(self._companies, group_by)
        hazard_rates_dict = self._survival_model.get_hazard_rates(self._companies, group_by)
        exit_heatmap = self._survival_model.get_exit_heatmap(self._companies)

        # ── curves: wide-format [{time, Group1: surv, Group2: surv, ...}] ──
        groups = list(km_curves_dict.keys())
        all_times = sorted(set(p["time"] for km in km_curves_dict.values() for p in km))
        curves = []
        for t in all_times:
            row: Dict[str, Any] = {"time": t}
            for grp, km in km_curves_dict.items():
                surv = 1.0
                for p in km:
                    if p["time"] <= t:
                        surv = p["survival"]
                row[grp] = round(surv, 4)
            curves.append(row)

        # ── hazard_rates: [{sector, hazard}] sorted desc ──────────────────
        hazard_rates_list = sorted(
            [{"sector": grp, "hazard": round(rate, 4)} for grp, rate in hazard_rates_dict.items()],
            key=lambda x: x["hazard"],
            reverse=True,
        )

        # ── heatmap: [{sector, '2017': rate, ...}] ────────────────────────
        heatmap_sectors = exit_heatmap.get("sectors", [])
        heatmap_vintages = exit_heatmap.get("vintages", [])
        heatmap_matrix = exit_heatmap.get("matrix", [])
        heatmap = []
        for i, sector in enumerate(heatmap_sectors):
            row = {"sector": sector}
            for j, vintage in enumerate(heatmap_vintages):
                if i < len(heatmap_matrix) and j < len(heatmap_matrix[i]):
                    row[str(vintage)] = heatmap_matrix[i][j]
            heatmap.append(row)

        # ── insights ──────────────────────────────────────────────────────
        global_km = self._survival_model._global_km
        median_time: float = global_km[-1]["time"] if global_km else 5.0
        for p in global_km:
            if p["survival"] < 0.5:
                median_time = round(p["time"], 1)
                break
        surv_5yr = 1.0
        for p in global_km:
            if p["time"] <= 5.0:
                surv_5yr = p["survival"]
        five_yr_exit_prob = round((1.0 - surv_5yr) * 100)
        highest_risk = max(hazard_rates_dict, key=lambda k: hazard_rates_dict[k]) if hazard_rates_dict else "N/A"
        lowest_risk = min(hazard_rates_dict, key=lambda k: hazard_rates_dict[k]) if hazard_rates_dict else "N/A"
        insights = {
            "median_time_to_exit": median_time,
            "five_year_exit_probability": five_yr_exit_prob,
            "highest_risk": highest_risk,
            "lowest_risk": lowest_risk,
        }

        # ── vintage_table: [{vintage, cohort_size, exited, active, ...}] ──
        vintage_groups: Dict[int, list] = {}
        for c in self._companies:
            vy = c.get("vintage_year", 2020)
            vintage_groups.setdefault(vy, []).append(c)

        current_year = datetime.date.today().year
        vintage_table = []
        for vintage in sorted(vintage_groups.keys()):
            cohort = vintage_groups[vintage]
            exited = [c for c in cohort if c["status"] == "exited"]
            active = [c for c in cohort if c["status"] == "active"]
            holds = sorted(c.get("holding_period", 0.0) for c in exited)
            median_hold = round(holds[len(holds) // 2], 1) if holds else 0.0
            moics = [c.get("moic_current", 1.0) for c in cohort]
            avg_moic = round(sum(moics) / len(moics), 1) if moics else 1.0
            years_elapsed = max(0, current_year - vintage)
            if years_elapsed >= 5:
                five_yr_exited = [c for c in cohort if c["status"] == "exited" and c.get("holding_period", 0) <= 5.0]
                five_yr_rate = f"{round(len(five_yr_exited) / max(len(cohort), 1) * 100)}%"
            else:
                five_yr_rate = f"{round(len(exited) / max(len(cohort), 1) * 100)}%"
            vintage_table.append({
                "vintage": vintage,
                "cohort_size": len(cohort),
                "exited": len(exited),
                "active": len(active),
                "median_hold": median_hold,
                "avg_moic": avg_moic,
                "five_yr_exit_rate": five_yr_rate,
            })

        return {
            "curves": curves,
            "groups": groups,
            "hazard_rates": hazard_rates_list,
            "heatmap": heatmap,
            "insights": insights,
            "vintage_table": vintage_table,
        }

    # ------------------------------------------------------------------
    # Explainability
    # ------------------------------------------------------------------

    def get_explainability(self, company_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_init()
        company = self._find_company(company_id)
        if not company:
            return None

        feature_importance = self._moic_model.get_feature_importance()
        shap_values = self._moic_model.get_shap_values(company)

        return {
            "feature_importance": feature_importance,
            "shap_values": shap_values,
            "company_id": company_id,
        }

    # ------------------------------------------------------------------
    # Chat assistant
    # ------------------------------------------------------------------

    def chat(self, company_id: str, message: str) -> Dict[str, Any]:
        self._ensure_init()
        company = self._find_company(company_id)
        if not company:
            return {
                "response": "I could not locate the specified company in the portfolio database.",
                "company_id": company_id,
                "context_used": [],
            }

        msg_lower = message.lower()
        context_used = []
        response = ""

        name = company.get("name", "the company")
        kpis = company.get("kpis", {})
        moic = kpis.get("moic_current", company.get("moic_current", 1.5))
        margin = kpis.get("ebitda_margin", company.get("ebitda_margin", 0.25))
        growth = kpis.get("revenue_growth_ttm", company.get("revenue_growth", 0.12))
        sector = company.get("sector", "")
        holding = company.get("holding_period", 3.0)
        status = company.get("status", "active")
        nav = kpis.get("current_nav", company.get("current_nav", 500))
        leverage = kpis.get("net_debt_ebitda", company.get("entry_leverage", 4.0))

        # Fetch predictions for context
        predictions = self.get_predictions(company_id)

        if any(kw in msg_lower for kw in ["exit", "timing", "when", "sale", "ipo"]):
            context_used = ["survival_model", "exit_probability"]
            if predictions:
                exit_probs = predictions.get("exit_probability_by_year", {})
                prob_3yr = exit_probs.get("3", 0.5)
                prob_5yr = exit_probs.get("5", 0.75)
                surv_curve = predictions.get("survival_curve", [])
                median_exit_time = "4-5 years"
                for point in surv_curve:
                    if point["survival_prob"] < 0.5:
                        median_exit_time = f"{point['time']:.1f} years"
                        break

                response = (
                    f"Based on the survival analysis for {name}, the model estimates a "
                    f"{prob_3yr*100:.0f}% probability of exit within 3 years and {prob_5yr*100:.0f}% "
                    f"within 5 years. The median expected holding period from entry is approximately "
                    f"{median_exit_time}, consistent with its {sector} sector peers. "
                    f"Given the current holding period of {holding:.1f} years and a MOIC of {moic:.1f}x, "
                    f"the business is approaching a typical exit window. "
                    f"Strategic sale to a sector-focused acquirer remains the most likely exit pathway given current market conditions."
                )
            else:
                response = (
                    f"{name} is currently {holding:.1f} years into the holding period with a MOIC of {moic:.1f}x. "
                    f"Based on sector benchmarks, the expected total hold is 4-6 years. "
                    f"Exit preparation should commence in the next 12-18 months to maximise optionality across strategic, secondary, and IPO pathways."
                )

        elif any(kw in msg_lower for kw in ["risk", "concern", "downside", "threat", "leverage"]):
            context_used = ["risk_indicators", "company_data"]
            risk_indicators = predictions.get("risk_indicators", []) if predictions else []
            high_risks = [r for r in risk_indicators if r.get("level") == "high"]
            swot = company.get("swot", {})
            threats = swot.get("threats", ["Competitive pressure", "Market risk"])

            leverage_comment = (
                f"leverage at {leverage:.1f}x Net Debt/EBITDA is within acceptable bounds"
                if leverage < 4.5
                else f"leverage at {leverage:.1f}x Net Debt/EBITDA is elevated and warrants monitoring"
            )

            response = (
                f"The key risk considerations for {name} include {threats[0].lower() if threats else 'market risk'} "
                f"and {threats[1].lower() if len(threats) > 1 else 'competitive dynamics'}. "
                f"From a financial risk perspective, {leverage_comment}. "
                f"{'High-priority risk flags include: ' + ', '.join(r.get('name', '') for r in high_risks[:2]) + '.' if high_risks else 'No critical risk flags are currently elevated.'} "
                f"Revenue growth of {growth*100:.1f}% and EBITDA margins of {margin*100:.1f}% provide a "
                f"{'strong' if margin > 0.30 else 'adequate'} buffer against operational headwinds. "
                f"Active monitoring of {sector.lower()} sector macro conditions is recommended."
            )

        elif any(kw in msg_lower for kw in ["moic", "return", "performance", "multiple", "irr"]):
            context_used = ["moic_model", "predictions"]
            if predictions:
                p10 = predictions.get("moic_p10", 1.5)
                p50 = predictions.get("moic_p50", 2.5)
                p90 = predictions.get("moic_p90", 4.0)
                response = (
                    f"{name} is currently tracking at {moic:.1f}x MOIC with ${nav:.0f}M NAV. "
                    f"The MOIC prediction model estimates a P50 exit MOIC of {p50:.1f}x, with a "
                    f"downside P10 scenario of {p10:.1f}x and an upside P90 scenario of {p90:.1f}x. "
                    f"The {margin*100:.0f}% EBITDA margin and {growth*100:.0f}% revenue growth profile "
                    f"are the primary drivers of the bullish case, while {sector.lower()} sector "
                    f"valuation multiples represent the key swing factor in the distribution. "
                    f"A base case realisation in the {p50:.1f}x-{p90:.1f}x range appears achievable given the current operating trajectory."
                )
            else:
                response = (
                    f"{name} is currently tracking at a {moic:.1f}x MOIC, reflecting strong underlying business performance. "
                    f"Revenue growth of {growth*100:.1f}% and EBITDA margins of {margin*100:.1f}% support a continued "
                    f"value creation trajectory. The business is well-positioned to deliver a {max(moic * 1.2, 2.5):.1f}x+ "
                    f"exit MOIC at the expected hold exit window."
                )

        elif any(kw in msg_lower for kw in ["improve", "value creation", "growth", "strategy", "operational"]):
            context_used = ["swot", "financials"]
            swot = company.get("swot", {})
            opportunities = swot.get("opportunities", ["International expansion", "Product extension"])
            weaknesses = swot.get("weaknesses", ["Concentration risk"])

            response = (
                f"The primary value creation levers for {name} are centred on three areas. "
                f"First, {opportunities[0].lower() if opportunities else 'international expansion'} "
                f"represents the most significant organic growth opportunity in the near term. "
                f"Second, margin improvement through operational efficiency initiatives could add "
                f"{int(margin * 100 + 3)}-{int(margin * 100 + 6)} percentage points to the EBITDA margin "
                f"from the current {margin*100:.0f}% level. "
                f"Third, addressing {weaknesses[0].lower() if weaknesses else 'concentration risk'} "
                f"would strengthen the business quality and support multiple expansion at exit. "
                f"Implementation of a bolt-on M&A programme is also recommended to accelerate the growth roadmap."
            )

        elif any(kw in msg_lower for kw in ["financial", "revenue", "ebitda", "margin", "earnings"]):
            context_used = ["financials", "kpis"]
            fin = company.get("financials", {})
            rev_list = fin.get("revenue", [])
            ebitda_list = fin.get("ebitda", [])
            years = fin.get("years", [])

            latest_rev = rev_list[-1] if rev_list else 0
            latest_ebitda = ebitda_list[-1] if ebitda_list else 0

            response = (
                f"{name} generated ${latest_rev:.0f}M in revenue and ${latest_ebitda:.0f}M in EBITDA "
                f"in its most recent financial year, representing {growth*100:.0f}% revenue growth "
                f"and a {margin*100:.0f}% EBITDA margin. "
                f"The business has demonstrated consistent financial performance over {len(years)} years "
                f"with compound annual revenue growth of approximately {growth*100:.0f}%. "
                f"EBITDA margin {'expansion' if margin > 0.28 else 'maintenance'} reflects the "
                f"{'scalability of the operating model' if margin > 0.28 else 'operational investments being made for future growth'}. "
                f"Net debt/EBITDA of {leverage:.1f}x is {'comfortable' if leverage < 4.0 else 'moderate'} and trending in the right direction."
            )

        else:
            # Default: general company overview
            context_used = ["company_data", "kpis"]
            response = (
                f"{name} is a {sector} sector portfolio company currently valued at ${nav:.0f}M, "
                f"generating a {moic:.1f}x MOIC after {holding:.1f} years in the portfolio. "
                f"The business is delivering {growth*100:.0f}% revenue growth with {margin*100:.0f}% EBITDA margins, "
                f"reflecting a {'strong' if margin > 0.30 else 'solid'} operational performance trajectory. "
                f"{'The company is on track for a near-term exit process.' if holding > 3.5 and status == 'active' else 'The investment is in the early-to-mid value creation phase.'} "
                f"Key focus areas include executing on the growth strategy and optimising the capital structure ahead of exit."
            )

        return {
            "response": response,
            "company_id": company_id,
            "context_used": context_used,
        }

    # ------------------------------------------------------------------
    # Risk indicator computation
    # ------------------------------------------------------------------

    def _compute_risk_indicators(self, company: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Compute risk indicators for a company."""
        indicators = []
        kpis = company.get("kpis", {})

        # Leverage risk
        leverage = kpis.get("net_debt_ebitda", company.get("entry_leverage", 4.0))
        if leverage >= 5.0:
            lev_level, lev_score = "high", 0.85
        elif leverage >= 3.5:
            lev_level, lev_score = "medium", 0.5
        else:
            lev_level, lev_score = "low", 0.2
        indicators.append({
            "name": "Leverage Risk",
            "level": lev_level,
            "score": round(lev_score, 2),
            "description": f"Net Debt/EBITDA of {leverage:.1f}x {'exceeds' if leverage >= 5.0 else 'is within'} target threshold",
        })

        # Revenue growth risk
        growth = kpis.get("revenue_growth_ttm", company.get("revenue_growth", 0.12))
        if growth < 0.05:
            gr_level, gr_score = "high", 0.8
        elif growth < 0.10:
            gr_level, gr_score = "medium", 0.45
        else:
            gr_level, gr_score = "low", 0.15
        indicators.append({
            "name": "Growth Risk",
            "level": gr_level,
            "score": round(gr_score, 2),
            "description": f"Revenue growth of {growth*100:.1f}% {'is below' if growth < 0.08 else 'is consistent with'} investment thesis",
        })

        # Margin risk
        margin = kpis.get("ebitda_margin", company.get("ebitda_margin", 0.25))
        if margin < 0.15:
            mg_level, mg_score = "high", 0.75
        elif margin < 0.22:
            mg_level, mg_score = "medium", 0.45
        else:
            mg_level, mg_score = "low", 0.18
        indicators.append({
            "name": "Margin Risk",
            "level": mg_level,
            "score": round(mg_score, 2),
            "description": f"EBITDA margin of {margin*100:.1f}% {'is below' if margin < 0.20 else 'is healthy at'} sector benchmarks",
        })

        # Holding period risk
        hp = float(company.get("holding_period", 3.0))
        status = company.get("status", "active")
        if status == "active" and hp > 6.0:
            hp_level, hp_score = "high", 0.80
        elif status == "active" and hp > 4.5:
            hp_level, hp_score = "medium", 0.50
        else:
            hp_level, hp_score = "low", 0.20
        indicators.append({
            "name": "Holding Period Risk",
            "level": hp_level,
            "score": round(hp_score, 2),
            "description": f"Current holding period of {hp:.1f} years {'is extended' if hp > 5.5 else 'is within normal range'}",
        })

        # MOIC risk
        moic = kpis.get("moic_current", company.get("moic_current", 1.5))
        if moic < 1.0:
            mc_level, mc_score = "high", 0.90
        elif moic < 1.5:
            mc_level, mc_score = "medium", 0.55
        else:
            mc_level, mc_score = "low", 0.15
        indicators.append({
            "name": "Return Risk",
            "level": mc_level,
            "score": round(mc_score, 2),
            "description": f"Current MOIC of {moic:.1f}x {'is below' if moic < 1.5 else 'is tracking towards'} target return",
        })

        return indicators

    # ------------------------------------------------------------------
    # Internal serialisers
    # ------------------------------------------------------------------

    def _to_company_summary(self, c: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": c["id"],
            "name": c["name"],
            "fund": c["fund"],
            "vintage_year": c["vintage_year"],
            "sector": c["sector"],
            "geography": c["geography"],
            "status": c["status"],
            "entry_ev": c["entry_ev"],
            "current_nav": c["current_nav"],
            "moic_current": c["moic_current"],
            "holding_period": c["holding_period"],
            "revenue_growth": c["revenue_growth"],
            "ebitda_margin": c["ebitda_margin"],
        }

    def _to_company_detail(self, c: Dict[str, Any]) -> Dict[str, Any]:
        detail = self._to_company_summary(c)
        detail.update({
            "fund_id": c.get("fund_id", ""),
            "country": c.get("country", ""),
            "entry_date": c.get("entry_date", ""),
            "exit_date": c.get("exit_date"),
            "exit_ev": c.get("exit_ev"),
            "exit_moic": c.get("exit_moic"),
            "exit_type": c.get("exit_type"),
            "description": c.get("description", ""),
            "investment_thesis": c.get("investment_thesis", ""),
            "management": c.get("management", []),
            "financials": c.get("financials", {}),
            "kpis": c.get("kpis", {}),
            "swot": c.get("swot", {}),
            "peers": c.get("peers", []),
            "news": c.get("news", []),
        })
        return detail

    def _to_fund_summary(self, f: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": f["id"],
            "name": f["name"],
            "vintage_year": f["vintage_year"],
            "strategy": f.get("strategy", "Mid-Market Buyout"),
            "committed_capital": f["committed_capital"],
            "deployed_capital": f["deployed_capital"],
            "nav": f["nav"],
            "dpi": f["dpi"],
            "tvpi": f["tvpi"],
            "rvpi": f["rvpi"],
            "num_companies": f["num_companies"],
            "num_exits": f["num_exits"],
        }

    # ------------------------------------------------------------------
    # Fund analytics helpers
    # ------------------------------------------------------------------

    def _build_nav_history(
        self,
        companies: List[Dict[str, Any]],
        vintage: int,
        current_year: int,
    ) -> List[Dict[str, Any]]:
        """Build NAV history from vintage to current year."""
        active_companies = [c for c in companies if c["status"] == "active"]
        total_nav = sum(c.get("current_nav", 0) for c in active_companies)

        nav_history = []
        n_years = current_year - vintage + 1
        for i, yr in enumerate(range(vintage, current_year + 1)):
            factor = (i / max(n_years - 1, 1)) ** 1.3 * 0.85 + 0.15
            nav_history.append({
                "year": yr,
                "nav": round(total_nav * factor, 1),
            })
        return nav_history

    def _build_dpi_trajectory(
        self,
        companies: List[Dict[str, Any]],
        fund: Dict[str, Any],
        vintage: int,
        current_year: int,
    ) -> List[Dict[str, Any]]:
        """Build DPI trajectory over fund life."""
        deployed = fund.get("deployed_capital", 1.0)
        exited_companies = [c for c in companies if c["status"] == "exited"]
        total_realised = sum(
            c.get("exit_moic", 1.0) * c.get("entry_ev", 300) * 0.4
            for c in exited_companies
        )
        final_dpi = total_realised / max(deployed, 1.0)

        dpi_trajectory = []
        for yr in range(vintage, current_year + 1):
            if yr <= vintage + 2:
                factor = 0.0
            else:
                elapsed = yr - (vintage + 2)
                total_span = current_year - (vintage + 2)
                factor = (elapsed / max(total_span, 1)) ** 2
            dpi_trajectory.append({
                "year": yr,
                "dpi": round(final_dpi * factor, 3),
            })
        return dpi_trajectory

    def _build_tvpi_trajectory(
        self,
        nav_history: List[Dict[str, Any]],
        dpi_trajectory: List[Dict[str, Any]],
        deployed: float,
    ) -> List[Dict[str, Any]]:
        """Compute TVPI = (NAV + Distributions) / Deployed."""
        nav_by_year = {item["year"]: item["nav"] for item in nav_history}
        dpi_by_year = {item["year"]: item["dpi"] for item in dpi_trajectory}

        tvpi_trajectory = []
        for yr in nav_by_year:
            nav = nav_by_year.get(yr, 0)
            dpi = dpi_by_year.get(yr, 0)
            realised = dpi * deployed
            tvpi = (nav + realised) / max(deployed, 1.0)
            tvpi_trajectory.append({
                "year": yr,
                "tvpi": round(tvpi, 3),
            })
        return tvpi_trajectory

    def _build_cashflow_timeline(
        self,
        companies: List[Dict[str, Any]],
        vintage: int,
        current_year: int,
    ) -> List[Dict[str, Any]]:
        """Build annual investment and distribution cashflows."""
        year_range = list(range(vintage, current_year + 1))
        cashflows: Dict[int, Dict[str, float]] = {yr: {"investment": 0.0, "distributions": 0.0} for yr in year_range}

        for c in companies:
            entry_date = c.get("entry_date", f"{vintage + 1}-01-01")
            try:
                entry_year = int(entry_date[:4])
            except (ValueError, TypeError):
                entry_year = vintage + 1

            equity = c.get("entry_ev", 300) * 0.4
            if entry_year in cashflows:
                cashflows[entry_year]["investment"] += equity

            if c["status"] == "exited":
                exit_date = c.get("exit_date", "")
                try:
                    exit_year = int(exit_date[:4])
                except (ValueError, TypeError):
                    exit_year = current_year

                dist = c.get("exit_moic", 1.5) * equity
                if exit_year in cashflows:
                    cashflows[exit_year]["distributions"] += dist

        result = []
        for yr in year_range:
            inv = round(cashflows[yr]["investment"], 1)
            dist = round(cashflows[yr]["distributions"], 1)
            net = round(dist - inv, 1)
            result.append({
                "year": yr,
                "investment": inv,
                "distributions": dist,
                "net_cashflow": net,
            })
        return result

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _find_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        for c in self._companies:
            if c["id"] == company_id:
                return c
        return None

    def _find_fund(self, fund_id: str) -> Optional[Dict[str, Any]]:
        for f in self._funds:
            if f["id"] == fund_id:
                return f
        return None


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

service = AnalyticsService()

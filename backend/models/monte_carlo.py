"""
Monte Carlo Simulation for Fund-Level PE Analytics.

Simulates exit timing, MOIC distributions and cash flows across
n_simulations paths to produce fund-level performance distribution.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np


# ---------------------------------------------------------------------------
# MonteCarloSimulator
# ---------------------------------------------------------------------------

class MonteCarloSimulator:
    """Fund-level Monte Carlo simulation engine."""

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    # ------------------------------------------------------------------
    # Main simulation entry point
    # ------------------------------------------------------------------

    def run(
        self,
        fund_id: str,
        companies: List[Dict[str, Any]],
        fund_meta: Optional[Dict[str, Any]] = None,
        n_simulations: int = 500,
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation for a specific fund.

        Parameters
        ----------
        fund_id:       Fund identifier
        companies:     List of company dicts belonging to this fund
        fund_meta:     Fund metadata (committed_capital, deployed_capital, etc.)
        n_simulations: Number of simulation paths

        Returns
        -------
        Dict matching MonteCarloResult schema
        """
        if not companies:
            return self._empty_result(fund_id)

        deployed = fund_meta.get("deployed_capital", 1.0) if fund_meta else sum(
            c.get("entry_ev", 300) * 0.4 for c in companies
        )
        deployed = max(deployed, 1.0)

        current_year = 2024
        max_year = current_year + 10
        years = list(range(current_year, max_year + 1))

        # Per-company parameters
        company_params = [self._extract_company_params(c) for c in companies]

        # Store simulation results
        # Shape: (n_simulations, n_years)
        sim_dpi = np.zeros((n_simulations, len(years)))
        sim_tvpi = np.zeros((n_simulations, len(years)))
        sim_nav = np.zeros((n_simulations, len(years)))

        # Aggregate exit schedule across simulations
        exit_counts = np.zeros((n_simulations, len(years)))
        exit_capital = np.zeros((n_simulations, len(years)))

        for sim_i in range(n_simulations):
            cumulative_distributions = 0.0

            for c_idx, params in enumerate(company_params):
                company = companies[c_idx]
                equity_invested = params["equity_invested"]

                # Sample exit year
                exit_year = self._sample_exit_year(params, current_year)
                year_idx = min(max(exit_year - current_year, 0), len(years) - 1)

                # Sample MOIC for this path
                moic = self._sample_moic(params)
                distribution = equity_invested * moic

                # Record distribution at exit year
                if year_idx < len(years):
                    cumulative_distributions += distribution
                    exit_counts[sim_i, year_idx] += 1
                    exit_capital[sim_i, year_idx] += distribution

                # NAV contribution: for active companies, NAV decays after expected exit
                for yr_idx, yr in enumerate(years):
                    if yr < exit_year:
                        # Still in portfolio: NAV grows with sector multiple
                        years_from_entry = float(yr - (current_year - int(company.get("holding_period", 3))))
                        nav_growth = params["annual_nav_growth"] ** max(years_from_entry, 0)
                        nav_contribution = equity_invested * nav_growth
                        sim_nav[sim_i, yr_idx] += nav_contribution
                    # After exit: NAV = 0 for this company

            # Compute cumulative DPI and TVPI over time
            cum_dist = np.cumsum(exit_capital[sim_i])
            for yr_idx in range(len(years)):
                sim_dpi[sim_i, yr_idx] = cum_dist[yr_idx] / deployed
                sim_tvpi[sim_i, yr_idx] = (cum_dist[yr_idx] + sim_nav[sim_i, yr_idx]) / deployed

        # Compute percentile statistics
        p10_dpi = np.percentile(sim_dpi, 10, axis=0)
        p25_dpi = np.percentile(sim_dpi, 25, axis=0)
        p50_dpi = np.percentile(sim_dpi, 50, axis=0)
        p75_dpi = np.percentile(sim_dpi, 75, axis=0)
        p90_dpi = np.percentile(sim_dpi, 90, axis=0)

        p10_tvpi = np.percentile(sim_tvpi, 10, axis=0)
        p50_tvpi = np.percentile(sim_tvpi, 50, axis=0)
        p90_tvpi = np.percentile(sim_tvpi, 90, axis=0)

        p10_nav = np.percentile(sim_nav, 10, axis=0)
        p50_nav = np.percentile(sim_nav, 50, axis=0)
        p90_nav = np.percentile(sim_nav, 90, axis=0)

        mean_dpi = float(np.mean(sim_dpi[:, -1]))
        mean_tvpi = float(np.mean(sim_tvpi[:, -1]))

        # Build output structures
        fan_chart_data = []
        for yr_idx, yr in enumerate(years):
            fan_chart_data.append({
                "year": yr,
                "p10_dpi": round(float(p10_dpi[yr_idx]), 3),
                "p25_dpi": round(float(p25_dpi[yr_idx]), 3),
                "p50_dpi": round(float(p50_dpi[yr_idx]), 3),
                "p75_dpi": round(float(p75_dpi[yr_idx]), 3),
                "p90_dpi": round(float(p90_dpi[yr_idx]), 3),
            })

        nav_decay = []
        for yr_idx, yr in enumerate(years):
            nav_decay.append({
                "year": yr,
                "nav_mean": round(float(np.mean(sim_nav[:, yr_idx])), 1),
                "nav_p10": round(float(p10_nav[yr_idx]), 1),
                "nav_p90": round(float(p90_nav[yr_idx]), 1),
            })

        mean_exits = np.mean(exit_counts, axis=0)
        mean_capital = np.mean(exit_capital, axis=0)
        exit_schedule = []
        for yr_idx, yr in enumerate(years):
            exit_schedule.append({
                "year": yr,
                "expected_exits": round(float(mean_exits[yr_idx]), 2),
                "expected_capital_returned": round(float(mean_capital[yr_idx]), 1),
            })

        # Cashflow timeline (aggregate)
        cashflow_timeline = self._build_cashflow_timeline(companies, exit_schedule, deployed, years)

        percentile_10 = {
            "dpi_final": round(float(p10_dpi[-1]), 3),
            "tvpi_final": round(float(p10_tvpi[-1]), 3),
            "dpi_trajectory": [{"year": yr, "dpi": round(float(p10_dpi[i]), 3)} for i, yr in enumerate(years)],
            "tvpi_trajectory": [{"year": yr, "tvpi": round(float(p10_tvpi[i]), 3)} for i, yr in enumerate(years)],
        }
        percentile_50 = {
            "dpi_final": round(float(p50_dpi[-1]), 3),
            "tvpi_final": round(float(p50_tvpi[-1]), 3),
            "dpi_trajectory": [{"year": yr, "dpi": round(float(p50_dpi[i]), 3)} for i, yr in enumerate(years)],
            "tvpi_trajectory": [{"year": yr, "tvpi": round(float(p50_tvpi[i]), 3)} for i, yr in enumerate(years)],
        }
        percentile_90 = {
            "dpi_final": round(float(p90_dpi[-1]), 3),
            "tvpi_final": round(float(p90_tvpi[-1]), 3),
            "dpi_trajectory": [{"year": yr, "dpi": round(float(p90_dpi[i]), 3)} for i, yr in enumerate(years)],
            "tvpi_trajectory": [{"year": yr, "tvpi": round(float(p90_tvpi[i]), 3)} for i, yr in enumerate(years)],
        }

        return {
            "percentile_10": percentile_10,
            "percentile_50": percentile_50,
            "percentile_90": percentile_90,
            "mean_dpi": round(mean_dpi, 3),
            "mean_tvpi": round(mean_tvpi, 3),
            "nav_decay": nav_decay,
            "fan_chart_data": fan_chart_data,
            "exit_schedule": exit_schedule,
            "cashflow_timeline": cashflow_timeline,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _extract_company_params(self, company: Dict[str, Any]) -> Dict[str, Any]:
        """Extract simulation parameters from a company dict."""
        kpis = company.get("kpis", {})
        entry_ev = float(company.get("entry_ev", 300.0))
        equity_invested = entry_ev * 0.4  # ~40% equity, 60% debt

        moic_current = float(kpis.get("moic_current", company.get("moic_current", 1.5)))
        holding_period = float(company.get("holding_period", 3.0))
        growth = float(kpis.get("revenue_growth_ttm", company.get("revenue_growth", 0.12)))
        margin = float(kpis.get("ebitda_margin", company.get("ebitda_margin", 0.25)))

        # Expected remaining holding period
        status = company.get("status", "active")
        if status == "exited":
            remaining_hp = 0.0
            base_moic = float(company.get("exit_moic", moic_current))
        else:
            # Typical hold: 4-6 years total, already held holding_period years
            total_hold = max(4.0, holding_period + 1.5)
            remaining_hp = max(0.5, total_hold - holding_period)
            base_moic = moic_current * (1.0 + growth * remaining_hp * 0.3)
            base_moic = max(0.5, min(6.0, base_moic))

        # MOIC distribution parameters (lognormal)
        sigma_moic = 0.25 + (1.0 - margin) * 0.3  # higher margin = lower variance
        sigma_moic = float(np.clip(sigma_moic, 0.15, 0.6))

        # Exit year distribution (normal around expected exit)
        current_year = 2024
        exit_year_mean = current_year + remaining_hp if status == "active" else current_year
        exit_year_std = 1.0

        # Annual NAV growth
        annual_nav_growth = 1.0 + growth * 0.8

        return {
            "equity_invested": equity_invested,
            "base_moic": base_moic,
            "sigma_moic": sigma_moic,
            "exit_year_mean": exit_year_mean,
            "exit_year_std": exit_year_std,
            "annual_nav_growth": annual_nav_growth,
            "status": status,
            "remaining_hp": remaining_hp,
        }

    def _sample_exit_year(self, params: Dict[str, Any], current_year: int) -> int:
        """Sample exit year from a normal distribution."""
        if params["status"] == "exited":
            return current_year  # already exited

        mean_exit = params["exit_year_mean"]
        std_exit = params["exit_year_std"]
        sampled = float(self.rng.normal(mean_exit, std_exit))
        # Clamp to reasonable range
        sampled = max(current_year + 0.5, min(sampled, current_year + 10))
        return int(round(sampled))

    def _sample_moic(self, params: Dict[str, Any]) -> float:
        """Sample MOIC from a lognormal distribution."""
        base = params["base_moic"]
        sigma = params["sigma_moic"]
        # Lognormal: mean of log = log(base) - sigma^2/2 so that E[X] = base
        mu_log = float(np.log(max(base, 0.1)) - 0.5 * sigma ** 2)
        sampled = float(self.rng.lognormal(mu_log, sigma))
        return float(np.clip(sampled, 0.1, 8.0))

    def _build_cashflow_timeline(
        self,
        companies: List[Dict[str, Any]],
        exit_schedule: List[Dict[str, Any]],
        deployed: float,
        years: List[int],
    ) -> List[Dict[str, Any]]:
        """Build investment and distribution cashflow timeline."""
        current_year = 2024
        cashflows = {yr: {"investment": 0.0, "distributions": 0.0} for yr in years}

        for c in companies:
            entry_date = c.get("entry_date", "2020-01-01")
            try:
                entry_year = int(entry_date[:4])
            except (ValueError, TypeError):
                entry_year = 2020

            equity_invested = float(c.get("entry_ev", 300)) * 0.4

            if entry_year in cashflows:
                cashflows[entry_year]["investment"] += equity_invested
            elif entry_year < years[0]:
                cashflows[years[0]]["investment"] += equity_invested

        for item in exit_schedule:
            yr = item["year"]
            if yr in cashflows:
                cashflows[yr]["distributions"] += item["expected_capital_returned"]

        result = []
        for yr in years:
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

    def _empty_result(self, fund_id: str) -> Dict[str, Any]:
        """Return an empty result structure."""
        current_year = 2024
        years = list(range(current_year, current_year + 11))
        empty_fan = [
            {"year": yr, "p10_dpi": 0.0, "p25_dpi": 0.0, "p50_dpi": 0.0, "p75_dpi": 0.0, "p90_dpi": 0.0}
            for yr in years
        ]
        empty_nav = [{"year": yr, "nav_mean": 0.0, "nav_p10": 0.0, "nav_p90": 0.0} for yr in years]
        empty_exit = [{"year": yr, "expected_exits": 0.0, "expected_capital_returned": 0.0} for yr in years]
        empty_cf = [{"year": yr, "investment": 0.0, "distributions": 0.0, "net_cashflow": 0.0} for yr in years]

        return {
            "percentile_10": {"dpi_final": 0.0, "tvpi_final": 0.0, "dpi_trajectory": [], "tvpi_trajectory": []},
            "percentile_50": {"dpi_final": 0.0, "tvpi_final": 0.0, "dpi_trajectory": [], "tvpi_trajectory": []},
            "percentile_90": {"dpi_final": 0.0, "tvpi_final": 0.0, "dpi_trajectory": [], "tvpi_trajectory": []},
            "mean_dpi": 0.0,
            "mean_tvpi": 0.0,
            "nav_decay": empty_nav,
            "fan_chart_data": empty_fan,
            "exit_schedule": empty_exit,
            "cashflow_timeline": empty_cf,
        }

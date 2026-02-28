"""
Survival Analysis Model for PE Portfolio Companies.

Implements Kaplan-Meier estimator and company-level survival predictions
using numpy/scipy (no lifelines dependency required).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import numpy as np


# ---------------------------------------------------------------------------
# Standalone KM estimator
# ---------------------------------------------------------------------------

def _kaplan_meier(times: List[float], events: List[int]) -> List[Dict[str, float]]:
    """
    Standard Kaplan-Meier estimator.

    Parameters
    ----------
    times:  observation times (holding period in years)
    events: 1 = exited (event occurred), 0 = censored (still active)

    Returns
    -------
    List of {time, survival} dicts sorted by time.
    """
    if not times:
        return [{"time": 0.0, "survival": 1.0}]

    unique_times = sorted(set(times))
    n = len(times)
    survival = 1.0
    results = [{"time": 0.0, "survival": 1.0}]

    for t in unique_times:
        at_risk = sum(1 for ti in times if ti >= t)
        events_at_t = sum(1 for ti, ei in zip(times, events) if ti == t and ei == 1)
        if at_risk > 0 and events_at_t > 0:
            survival *= 1.0 - events_at_t / at_risk
        results.append({"time": float(t), "survival": float(survival)})

    return results


def _hazard_from_km(km_curve: List[Dict[str, float]]) -> float:
    """Estimate average hazard rate from a KM curve."""
    if len(km_curve) < 2:
        return 0.05
    # Negative log of final survival probability divided by time span
    final_surv = km_curve[-1]["survival"]
    final_time = km_curve[-1]["time"]
    if final_time <= 0 or final_surv <= 0:
        return 0.05
    return float(-np.log(max(final_surv, 1e-6)) / final_time)


# ---------------------------------------------------------------------------
# SurvivalModel
# ---------------------------------------------------------------------------

class SurvivalModel:
    """Kaplan-Meier based survival analysis for PE portfolio companies."""

    def __init__(self):
        self._fitted = False
        self._global_km: List[Dict[str, float]] = []
        self._km_by_sector: Dict[str, List[Dict[str, float]]] = {}
        self._km_by_geography: Dict[str, List[Dict[str, float]]] = {}
        self._km_by_fund: Dict[str, List[Dict[str, float]]] = {}
        self._hazard_by_sector: Dict[str, float] = {}
        self._sector_exit_rates: Dict[str, float] = {}
        self._all_companies: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # Fit
    # ------------------------------------------------------------------

    def fit(self, companies: List[Dict[str, Any]]) -> "SurvivalModel":
        """Fit the survival model on company data."""
        self._all_companies = companies

        # Global KM
        times = [c["holding_period"] for c in companies]
        events = [1 if c["status"] == "exited" else 0 for c in companies]
        self._global_km = _kaplan_meier(times, events)

        # By sector
        sectors = list(set(c["sector"] for c in companies))
        for sector in sectors:
            group = [c for c in companies if c["sector"] == sector]
            t = [c["holding_period"] for c in group]
            e = [1 if c["status"] == "exited" else 0 for c in group]
            self._km_by_sector[sector] = _kaplan_meier(t, e)
            self._hazard_by_sector[sector] = _hazard_from_km(self._km_by_sector[sector])
            exited = sum(1 for c in group if c["status"] == "exited")
            self._sector_exit_rates[sector] = exited / len(group) if group else 0.2

        # By geography
        geos = list(set(c["geography"] for c in companies))
        for geo in geos:
            group = [c for c in companies if c["geography"] == geo]
            t = [c["holding_period"] for c in group]
            e = [1 if c["status"] == "exited" else 0 for c in group]
            self._km_by_geography[geo] = _kaplan_meier(t, e)

        # By fund
        funds = list(set(c["fund_id"] for c in companies))
        for fund in funds:
            group = [c for c in companies if c["fund_id"] == fund]
            t = [c["holding_period"] for c in group]
            e = [1 if c["status"] == "exited" else 0 for c in group]
            self._km_by_fund[fund] = _kaplan_meier(t, e)

        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # Company-level prediction
    # ------------------------------------------------------------------

    def predict_company(self, company: Dict[str, Any]) -> List[Dict[str, float]]:
        """
        Return survival curve for a specific company over 0-10 years.
        Uses sector-specific KM curve adjusted for company characteristics.
        """
        sector = company.get("sector", "Technology")
        holding = company.get("holding_period", 0.0)
        current_hp = holding if company.get("status") == "active" else 0.0

        # Get base sector KM curve
        base_km = self._km_by_sector.get(sector, self._global_km)

        # Adjust hazard based on company risk factors
        hazard_multiplier = self._compute_hazard_multiplier(company)

        # Build smoothed survival curve over 0-10 years at 0.5-year intervals
        time_points = [t * 0.5 for t in range(21)]  # 0, 0.5, 1.0, ..., 10.0
        survival_curve = []

        base_hazard = self._hazard_by_sector.get(sector, 0.08)
        adjusted_hazard = base_hazard * hazard_multiplier

        for t in time_points:
            # Exponential survival adjusted by company risk
            raw_surv = float(np.exp(-adjusted_hazard * max(t, 0)))

            # Condition on having survived to current holding period
            if current_hp > 0:
                surv_to_now = float(np.exp(-adjusted_hazard * current_hp))
                if surv_to_now > 1e-6:
                    conditional_surv = min(1.0, raw_surv / surv_to_now) if t >= current_hp else 1.0
                else:
                    conditional_surv = 0.0
            else:
                conditional_surv = raw_surv

            survival_curve.append({
                "time": round(t, 1),
                "survival_prob": round(max(0.0, min(1.0, conditional_surv)), 4),
            })

        return survival_curve

    def _compute_hazard_multiplier(self, company: Dict[str, Any]) -> float:
        """
        Compute hazard multiplier based on company risk characteristics.
        Higher multiplier = higher exit probability (both good exits and distress).
        """
        multiplier = 1.0
        kpis = company.get("kpis", {})

        # EBITDA margin effect: stronger companies exit faster (good reasons)
        margin = kpis.get("ebitda_margin", company.get("ebitda_margin", 0.25))
        if margin > 0.35:
            multiplier *= 1.2
        elif margin < 0.15:
            multiplier *= 0.8

        # Revenue growth effect
        growth = kpis.get("revenue_growth_ttm", company.get("revenue_growth", 0.12))
        if growth > 0.20:
            multiplier *= 1.15
        elif growth < 0.05:
            multiplier *= 0.85

        # Leverage effect: high leverage = higher distress risk
        leverage = company.get("entry_leverage", 4.0)
        net_debt_ebitda = kpis.get("net_debt_ebitda", leverage * 0.7)
        if net_debt_ebitda > 5.0:
            multiplier *= 1.3
        elif net_debt_ebitda < 2.0:
            multiplier *= 0.9

        # MOIC effect: high MOIC companies are more attractive exit candidates
        moic = kpis.get("moic_current", company.get("moic_current", 1.5))
        if moic > 2.5:
            multiplier *= 1.25
        elif moic < 1.0:
            multiplier *= 0.75

        return float(np.clip(multiplier, 0.3, 3.0))

    # ------------------------------------------------------------------
    # Group-level analytics
    # ------------------------------------------------------------------

    def get_hazard_rates(self, companies: List[Dict[str, Any]], group_by: str = "sector") -> Dict[str, float]:
        """Return hazard rates grouped by the specified attribute."""
        if not self._fitted:
            self.fit(companies)

        if group_by == "sector":
            return dict(self._hazard_by_sector)
        elif group_by == "geography":
            result = {}
            for geo, km in self._km_by_geography.items():
                result[geo] = _hazard_from_km(km)
            return result
        elif group_by == "fund":
            result = {}
            for fund, km in self._km_by_fund.items():
                result[fund] = _hazard_from_km(km)
            return result
        else:
            return {"overall": _hazard_from_km(self._global_km)}

    def get_km_curves(self, companies: List[Dict[str, Any]], group_by: str = "sector") -> Dict[str, Any]:
        """Return KM curves for each group."""
        if not self._fitted:
            self.fit(companies)

        if group_by == "sector":
            result = {}
            for sector, km in self._km_by_sector.items():
                result[sector] = [{"time": p["time"], "survival": p["survival"]} for p in km]
            return result
        elif group_by == "geography":
            result = {}
            for geo, km in self._km_by_geography.items():
                result[geo] = [{"time": p["time"], "survival": p["survival"]} for p in km]
            return result
        elif group_by == "fund":
            result = {}
            for fund, km in self._km_by_fund.items():
                result[fund] = [{"time": p["time"], "survival": p["survival"]} for p in km]
            return result
        else:
            return {"overall": self._global_km}

    def get_exit_probability_by_year(self, company: Dict[str, Any]) -> Dict[str, float]:
        """
        Return probability of exit within each year (1-7 years from entry).
        """
        survival_curve = self.predict_company(company)

        # Build a dict of time -> survival_prob
        surv_dict = {p["time"]: p["survival_prob"] for p in survival_curve}

        def get_surv(t: float) -> float:
            if t in surv_dict:
                return surv_dict[t]
            # Interpolate
            times_sorted = sorted(surv_dict.keys())
            for i in range(len(times_sorted) - 1):
                if times_sorted[i] <= t <= times_sorted[i + 1]:
                    lo, hi = times_sorted[i], times_sorted[i + 1]
                    frac = (t - lo) / (hi - lo) if hi > lo else 0
                    return surv_dict[lo] + frac * (surv_dict[hi] - surv_dict[lo])
            return surv_dict.get(times_sorted[-1], 0.0)

        result = {}
        for year in range(1, 8):
            prob = 1.0 - get_surv(float(year))
            result[str(year)] = round(max(0.0, min(1.0, prob)), 4)

        return result

    def get_exit_heatmap(self, companies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Return exit heatmap data: sector x vintage_year matrix.
        """
        if not self._fitted:
            self.fit(companies)

        sectors = sorted(set(c["sector"] for c in companies))
        vintages = sorted(set(c["vintage_year"] for c in companies))

        matrix = []
        for sector in sectors:
            row = []
            for vintage in vintages:
                group = [
                    c for c in companies
                    if c["sector"] == sector and c["vintage_year"] == vintage
                ]
                if not group:
                    row.append(0.0)
                else:
                    exit_rate = sum(1 for c in group if c["status"] == "exited") / len(group)
                    row.append(round(exit_rate, 3))
            matrix.append(row)

        return {
            "sectors": sectors,
            "vintages": vintages,
            "matrix": matrix,
        }

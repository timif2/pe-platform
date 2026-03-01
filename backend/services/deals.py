"""
Deals Service - three-level hierarchy: Transaction → Fund → Company.

Assembles deal/fund/company data from a user-supplied CSV when available,
falling back to synthetic data otherwise.  ML predictions (Exit Date, Cost X,
NAV X) are produced by the existing MOIC + Survival models regardless of data
source.
"""
from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional

from data.csv_loader import get_csv_data
from services.analytics import service as analytics_service


# ---------------------------------------------------------------------------
# Synthetic fallback: static deal / fund definitions
# (used when no CSV is present)
# ---------------------------------------------------------------------------

_SYNTH_DEALS: List[Dict[str, Any]] = [
    {
        "id": "deal_001",
        "name": "Ardian Secondaries VII",
        "vintage": 2022,
        "committed_m": 925.0,
        "currency": "USD",
        "status": "Active",
        "fund_ids": ["fund_001", "fund_002"],
        "description": (
            "Secondaries portfolio targeting mid-market buyouts across Technology, "
            "Healthcare, and Industrials in North America and Europe."
        ),
    },
    {
        "id": "deal_002",
        "name": "Ardian Primaries V",
        "vintage": 2021,
        "committed_m": 750.0,
        "currency": "USD",
        "status": "Active",
        "fund_ids": ["fund_003"],
        "description": (
            "Primaries strategy focused on large-cap buyout funds with diversified "
            "sector exposure across Europe and North America."
        ),
    },
]

_SYNTH_DEAL_FUND_MAP: Dict[str, List[str]] = {
    d["id"]: d["fund_ids"] for d in _SYNTH_DEALS
}


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _quarterly_nav_keys() -> List[str]:
    """Return 6 trailing quarterly labels (MMM-YY) ending at the most recent quarter."""
    today = datetime.date.today()
    month_to_quarter = {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1,
                        7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3}
    quarter_months = ["Mar", "Jun", "Sep", "Dec"]
    q = month_to_quarter[today.month]
    y = today.year
    keys: List[str] = []
    for _ in range(6):
        keys.insert(0, f"{quarter_months[q]}-{str(y)[2:]}")
        q -= 1
        if q < 0:
            q = 3
            y -= 1
    return keys


def _build_synth_company_row(company: Dict[str, Any], q_keys: List[str]) -> Dict[str, Any]:
    """Convert a synthetic company dict into a Primary Fund Model row."""
    cost_m = company.get("entry_ev", 0) * 0.40
    current_nav = company.get("current_nav", 0)
    status = company.get("status", "active")
    exit_date = company.get("exit_date") if status == "exited" else None
    proceeds_m = current_nav if status == "exited" else 0.0
    nav_m = current_nav if status == "active" else 0.0
    exit_value_m = proceeds_m + nav_m
    nav_x = round(current_nav / cost_m, 2) if cost_m > 0 else 1.0

    financials = company.get("financials", {})
    valuations = financials.get("valuation", [])
    base_nav = valuations[-1] if valuations else current_nav
    quarterly_navs: Dict[str, float] = {}
    for i, k in enumerate(q_keys):
        factor = 0.76 + 0.04 * i + (hash(k + company["id"]) % 100) * 0.001
        quarterly_navs[k] = round(base_nav * factor, 1)

    return {
        "id": company["id"],
        "name": company["name"],
        "sector": company.get("sector", ""),
        "status": status,
        "exit_date": exit_date,
        "cost_m": round(cost_m, 1),
        "proceeds_m": round(proceeds_m, 1),
        "nav_m": round(nav_m, 1),
        "exit_value_m": round(exit_value_m, 1),
        "cost_x": 1.0,
        "nav_x": nav_x,
        "quarterly_navs": quarterly_navs,
    }


def _compute_totals(rows: List[Dict[str, Any]], q_keys: List[str]) -> Dict[str, Any]:
    """Sum a list of company rows into the 'Cash Flows from Existing Portfolio' row."""
    total_cost = sum(r["cost_m"] for r in rows)
    total_proceeds = sum(r["proceeds_m"] for r in rows)
    total_nav = sum(r["nav_m"] for r in rows)
    total_exit_value = sum(r["exit_value_m"] for r in rows)
    quarterly_totals = {
        k: round(sum(r["quarterly_navs"].get(k) or 0 for r in rows), 1)
        for k in q_keys
    }
    nav_x = round(total_exit_value / total_cost, 2) if total_cost > 0 else 1.0

    return {
        "id": "__totals__",
        "name": "Cash Flows from Existing Portfolio",
        "sector": "",
        "status": "",
        "exit_date": None,
        "cost_m": round(total_cost, 1),
        "proceeds_m": round(total_proceeds, 1),
        "nav_m": round(total_nav, 1),
        "exit_value_m": round(total_exit_value, 1),
        "cost_x": 1.0,
        "nav_x": nav_x,
        "quarterly_navs": quarterly_totals,
    }


def _derive_exit_date(exit_probs: Dict[str, float]) -> str:
    """Derive a predicted exit date string from survival exit probability map."""
    current_year = datetime.date.today().year
    if not exit_probs:
        return f"{current_year + 3}-06-30"
    years_sorted = sorted(exit_probs.keys(), key=lambda x: int(x))
    prev, best_year, best_delta = 0.0, current_year + 3, 0.0
    for y_str in years_sorted:
        prob = exit_probs[y_str]
        delta = prob - prev
        if delta > best_delta:
            best_delta = delta
            best_year = current_year + int(y_str)
        prev = prob
    best_year = max(current_year + 1, min(best_year, current_year + 7))
    return f"{best_year}-06-30"


# ---------------------------------------------------------------------------
# DealsService
# ---------------------------------------------------------------------------

class DealsService:
    """Singleton service for deal hierarchy and fund model assembly."""

    _instance: Optional["DealsService"] = None

    def __new__(cls) -> "DealsService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    # ------------------------------------------------------------------
    # Deals
    # ------------------------------------------------------------------

    def get_all_deals(self) -> List[Dict[str, Any]]:
        csv = get_csv_data()
        if csv:
            return csv["deals"]

        # Synthetic fallback
        analytics_service._ensure_init()
        result = []
        for deal in _SYNTH_DEALS:
            fund_ids = deal["fund_ids"]
            companies = self._synth_companies_for_funds(fund_ids)
            total_nav = sum(c.get("current_nav", 0) for c in companies)
            total_cost = sum(c.get("entry_ev", 0) * 0.40 for c in companies)
            moic = round(total_nav / total_cost, 2) if total_cost > 0 else 1.0
            result.append({
                **deal,
                "total_nav_m": round(total_nav, 1),
                "total_companies": len(companies),
                "moic": moic,
            })
        return result

    def get_deal(self, deal_id: str) -> Optional[Dict[str, Any]]:
        deals = self.get_all_deals()
        return next((d for d in deals if d["id"] == deal_id), None)

    # ------------------------------------------------------------------
    # Fund Model
    # ------------------------------------------------------------------

    def get_fund_model(self, deal_id: str, fund_id: str) -> Optional[Dict[str, Any]]:
        """Return a fund model: list of company rows + totals row."""
        csv = get_csv_data()

        if csv:
            return self._fund_model_from_csv(csv, deal_id, fund_id)

        return self._fund_model_from_synth(deal_id, fund_id)

    def _fund_model_from_csv(
        self,
        csv: Dict[str, Any],
        deal_id: str,
        fund_id: str,
    ) -> Optional[Dict[str, Any]]:
        # Validate deal/fund relationship
        deal = next((d for d in csv["deals"] if d["id"] == deal_id), None)
        if deal is None or fund_id not in deal["fund_ids"]:
            return None

        fund = csv["funds"].get(fund_id)
        if fund is None:
            return None

        q_keys = csv.get("quarter_keys") or _quarterly_nav_keys()

        # Strip ML-only fields from company rows before returning to client
        companies = [_strip_ml_fields(c) for c in fund["companies"]]
        totals = _compute_totals(companies, q_keys)

        return {
            "fund_id": fund_id,
            "fund_name": fund["name"],
            "deal_id": deal_id,
            "committed_m": fund["committed_m"],
            "nav_m": fund["nav_m"],
            "vintage": fund.get("vintage"),
            "quarter_keys": q_keys,
            "companies": companies,
            "totals": totals,
        }

    def _fund_model_from_synth(
        self, deal_id: str, fund_id: str
    ) -> Optional[Dict[str, Any]]:
        analytics_service._ensure_init()

        if deal_id not in _SYNTH_DEAL_FUND_MAP:
            return None
        if fund_id not in _SYNTH_DEAL_FUND_MAP[deal_id]:
            return None

        fund_summary = analytics_service.get_fund(fund_id)
        if fund_summary is None:
            return None

        companies = [
            c for c in analytics_service._companies
            if c.get("fund_id") == fund_id
        ]

        q_keys = _quarterly_nav_keys()
        rows = [_build_synth_company_row(c, q_keys) for c in companies]
        totals = _compute_totals(rows, q_keys)

        return {
            "fund_id": fund_id,
            "fund_name": fund_summary.get("name", fund_id),
            "deal_id": deal_id,
            "committed_m": fund_summary.get("committed_capital", 0),
            "nav_m": fund_summary.get("nav", 0),
            "vintage": fund_summary.get("vintage_year"),
            "quarter_keys": q_keys,
            "companies": rows,
            "totals": totals,
        }

    # ------------------------------------------------------------------
    # ML Predictions
    # ------------------------------------------------------------------

    def predict_companies(self, company_ids: List[str]) -> Dict[str, Any]:
        """
        Run MOIC + Survival model predictions for a list of company IDs.
        Handles both CSV-sourced and synthetic company IDs.
        Returns { company_id: { exit_date, cost_x, nav_x } }.
        """
        analytics_service._ensure_init()
        csv = get_csv_data()
        results: Dict[str, Any] = {}

        for cid in company_ids:
            # ── CSV path ──────────────────────────────────────────────────
            if csv and cid in csv["company_index"]:
                row = csv["company_index"][cid]
                company_dict = _csv_row_to_model_input(row)
                moic_preds = analytics_service._moic_model.predict(company_dict)
                exit_probs = analytics_service._survival_model.get_exit_probability_by_year(
                    company_dict
                )
                results[cid] = {
                    "exit_date": _derive_exit_date(exit_probs),
                    "cost_x": 1.0,
                    "nav_x": round(moic_preds["p50"], 2),
                }
                continue

            # ── Synthetic path ────────────────────────────────────────────
            preds = analytics_service.get_predictions(cid)
            if preds is None:
                continue
            results[cid] = {
                "exit_date": _derive_exit_date(preds.get("exit_probability_by_year", {})),
                "cost_x": 1.0,
                "nav_x": round(preds.get("moic_p50", 1.5), 2),
            }

        return results

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _synth_companies_for_funds(self, fund_ids: List[str]) -> List[Dict[str, Any]]:
        analytics_service._ensure_init()
        return [
            c for c in analytics_service._companies
            if c.get("fund_id") in fund_ids
        ]


# ---------------------------------------------------------------------------
# Module helpers
# ---------------------------------------------------------------------------

def _strip_ml_fields(company: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of a company row with internal ML fields removed."""
    return {k: v for k, v in company.items() if not k.startswith("_")}


def _csv_row_to_model_input(row: Dict[str, Any]) -> Dict[str, Any]:
    """Build a synthetic-compatible company dict from CSV ML fields for model input."""
    return {
        "id": row["id"],
        "status": row["status"],
        "sector": row["sector"],
        "geography": row.get("geography", "Europe"),
        "entry_ev": row.get("_entry_ev", 300.0),
        "entry_ebitda": row.get("_entry_ebitda", 40.0),
        "entry_leverage": row.get("_entry_leverage", 4.0),
        "entry_ev_ebitda": row.get("_entry_ev_ebitda", 8.0),
        "vintage_year": row.get("_vintage_year", 2020),
        "revenue_growth": row.get("_revenue_growth", 0.08),
        "ebitda_margin": row.get("_ebitda_margin", 0.20),
        "holding_period": row.get("_holding_period", 3.0),
        "current_nav": row.get("_current_nav", 0.0),
        "moic_current": row.get("_moic", 1.0),
    }


service = DealsService()

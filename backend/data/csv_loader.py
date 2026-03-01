"""
Portfolio CSV Loader.

Reads a user-supplied CSV file (one row per company per record date) and
converts it into the fund / deal / company data structure used by the Deals
dashboard.  Falls back gracefully when the file is not present — the rest of
the application continues to use synthetic data.

File placement:  backend/data/portfolio_data.csv
Override path:   set env var  PORTFOLIO_CSV_PATH=/path/to/file.csv
"""
from __future__ import annotations

import hashlib
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger("pe_analytics.csv_loader")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_DEFAULT_CSV = os.path.join(os.path.dirname(__file__), "portfolio_data.csv")
CSV_PATH: str = os.environ.get("PORTFOLIO_CSV_PATH", _DEFAULT_CSV)

# ---------------------------------------------------------------------------
# Geography mapping
# ---------------------------------------------------------------------------

_GEO_MAP: List[Tuple[List[str], str]] = [
    (["north america", "usa", "us ", "canada", "united states", "american"], "North America"),
    (["asia", "china", "japan", "india", "apac", "pacific", "australia",
      "singapore", "hong kong", "korea", "southeast"], "Asia Pacific"),
    # Europe is the default for Ardian portfolios
]


def _map_geography(raw: str) -> str:
    if not raw:
        return "Europe"
    lower = raw.lower()
    for keywords, label in _GEO_MAP:
        if any(kw in lower for kw in keywords):
            return label
    return "Europe"


# ---------------------------------------------------------------------------
# Quarter helpers
# ---------------------------------------------------------------------------

_QUARTER_MONTHS = ["Mar", "Jun", "Sep", "Dec"]
_MONTH_TO_QE = {1: 3, 2: 3, 3: 3, 4: 6, 5: 6, 6: 6,
                7: 9, 8: 9, 9: 9, 10: 12, 11: 12, 12: 12}


def _date_to_quarter_key(date_val: Any) -> Optional[str]:
    """Convert any date-like value to a quarter-end key such as 'Mar-25'."""
    try:
        if pd.isna(date_val):
            return None
        d = pd.to_datetime(date_val)
        qe_month = _MONTH_TO_QE[d.month]
        label = {3: "Mar", 6: "Jun", 9: "Sep", 12: "Dec"}[qe_month]
        return f"{label}-{str(d.year)[2:]}"
    except Exception:
        return None


def _quarter_key_to_sort_key(key: str) -> Tuple[int, int]:
    """Return (year, quarter_index) for sorting quarter keys chronologically."""
    try:
        month_str, yr = key.split("-")
        year = int("20" + yr)
        q = _QUARTER_MONTHS.index(month_str)
        return (year, q)
    except Exception:
        return (0, 0)


# ---------------------------------------------------------------------------
# Safe accessors
# ---------------------------------------------------------------------------

def _f(row: pd.Series, *cols: str, default: float = 0.0) -> float:
    """Return first non-null float from the given column names."""
    for col in cols:
        v = row.get(col)
        try:
            if not pd.isna(v):
                return float(v)
        except (TypeError, ValueError):
            pass
    return default


def _s(row: pd.Series, *cols: str, default: str = "") -> str:
    """Return first non-null string from the given column names."""
    for col in cols:
        v = row.get(col)
        try:
            if not pd.isna(v):
                s = str(v).strip()
                if s:
                    return s
        except (TypeError, ValueError):
            pass
    return default


def _is_realized(row: pd.Series) -> bool:
    v = row.get("realized", 0)
    try:
        if pd.isna(v):
            return False
    except TypeError:
        pass
    return str(v).strip().lower() in {"1", "1.0", "true", "yes", "y", "realized"}


# ---------------------------------------------------------------------------
# Deal grouping
# ---------------------------------------------------------------------------

def _make_deal_groups(
    fund_names: List[str],
    gp_name_by_fund: Dict[str, str],
) -> List[Dict[str, Any]]:
    """
    Randomly (but reproducibly) group funds into deals of size 2–10.
    Deal name comes from the fund_gp_name of the first fund in each group.
    """
    rng = np.random.default_rng(seed=42)
    shuffled = list(fund_names)
    rng.shuffle(shuffled)

    groups: List[List[str]] = []
    i = 0
    remaining = len(shuffled)
    while i < len(shuffled):
        max_size = min(10, remaining)
        size = int(rng.integers(2, max_size + 1)) if max_size >= 2 else remaining
        groups.append(shuffled[i: i + size])
        remaining -= size
        i += size

    deals = []
    for group in groups:
        gp_name = gp_name_by_fund.get(group[0], group[0])
        deal_id = "csv_" + hashlib.md5(gp_name.encode()).hexdigest()[:8]
        fund_ids = ["csv_" + hashlib.md5(fn.encode()).hexdigest()[:8] for fn in group]
        deals.append({
            "id": deal_id,
            "name": gp_name,
            "vintage": None,
            "committed_m": 0.0,
            "currency": "USD",
            "status": "Active",
            "fund_ids": fund_ids,
            "description": f"Portfolio managed by {gp_name}.",
            "total_nav_m": 0.0,
            "total_companies": 0,
            "moic": 1.0,
        })
    return deals


# ---------------------------------------------------------------------------
# Main loader
# ---------------------------------------------------------------------------

def load_csv() -> Optional[Dict[str, Any]]:
    """
    Parse the portfolio CSV and return structured deal/fund/company data.
    Returns None if the CSV file cannot be found or parsed.
    """
    if not os.path.exists(CSV_PATH):
        logger.info("Portfolio CSV not found at %s — using synthetic data", CSV_PATH)
        return None

    try:
        df = pd.read_csv(CSV_PATH, low_memory=False)
        logger.info("Loaded portfolio CSV: %d rows × %d columns", len(df), len(df.columns))
    except Exception as exc:
        logger.warning("Failed to read portfolio CSV: %s", exc)
        return None

    # Normalise column names
    df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]

    # Parse record_date
    if "record_date" in df.columns:
        df["_rd_parsed"] = pd.to_datetime(df["record_date"], errors="coerce")
    else:
        df["_rd_parsed"] = pd.NaT

    # ── Per-company processing ────────────────────────────────────────────────
    funds_dict: Dict[str, Dict[str, Any]] = {}
    company_index: Dict[str, Dict[str, Any]] = {}
    gp_name_by_fund: Dict[str, str] = {}   # fund_name → gp_name
    fund_id_by_name: Dict[str, str] = {}

    # All quarter keys seen in the data (for building the column headers)
    all_quarter_keys: set = set()

    grouped = df.groupby(["fund_name", "company_name"], sort=False)

    for (fund_name, company_name), group in grouped:
        fund_name = str(fund_name).strip()
        company_name = str(company_name).strip()

        fund_id = "csv_" + hashlib.md5(fund_name.encode()).hexdigest()[:8]
        company_id = "csv_" + hashlib.md5((fund_name + company_name).encode()).hexdigest()[:8]

        fund_id_by_name[fund_name] = fund_id

        # Sort rows by record date
        group = group.sort_values("_rd_parsed", ascending=True)
        latest = group.iloc[-1]

        # GP name (take from latest row)
        gp_name = _s(latest, "fund_gp_name", default=fund_name)
        gp_name_by_fund[fund_name] = gp_name

        # Status
        is_real = _is_realized(latest)
        status = "exited" if is_real else "active"

        # Financials
        cost_m = _f(latest, "original_cost")
        if is_real:
            proceeds_m = _f(latest, "proceeds")
            nav_m = 0.0
        else:
            proceeds_m = 0.0
            nav_m = _f(latest, "nav_at_rd")
        exit_value_m = proceeds_m + nav_m

        # MOIC
        if is_real:
            nav_x = _f(latest, "effective_exit_moic") or _f(latest, "moic")
        else:
            nav_x = _f(latest, "moic") or (exit_value_m / cost_m if cost_m > 0 else 1.0)
        nav_x = round(nav_x, 2) if nav_x else 1.0

        # Exit date
        exit_date: Optional[str] = None
        if is_real:
            raw_date = latest.get("effective_exit_date")
            try:
                if not pd.isna(raw_date):
                    exit_date = pd.to_datetime(raw_date).strftime("%Y-%m-%d")
            except Exception:
                pass

        # Sector / geography
        sector = _s(latest, "company_main_sector_agregate_", "company_sector", default="Other")
        geo_raw = _s(latest, "company_geography", "company_continent", default="")
        geography = _map_geography(geo_raw)

        # ── Quarterly NAV history ─────────────────────────────────────────
        quarterly_navs: Dict[str, float] = {}
        for _, hist_row in group.iterrows():
            qkey = _date_to_quarter_key(hist_row.get("_rd_parsed"))
            if qkey is None:
                continue
            nav_val = _f(hist_row, "nav_at_rd")
            if nav_val or is_real:
                quarterly_navs[qkey] = round(nav_val, 1) if not is_real else round(proceeds_m, 1)
            all_quarter_keys.add(qkey)

        # ML features (from latest row)
        vintage_year = 2020
        inv_date = latest.get("investment_date")
        try:
            if not pd.isna(inv_date):
                vintage_year = pd.to_datetime(inv_date).year
        except Exception:
            pass

        ml_fields = {
            "_entry_ev": _f(latest, "at_entry_ev", default=300.0),
            "_entry_ebitda": _f(latest, "at_entry_ebidta", default=40.0),
            "_entry_leverage": _f(latest, "net_debt_multiple_at_entry", default=4.0),
            "_entry_ev_ebitda": _f(latest, "at_entry_ebitda_x", default=8.0),
            "_vintage_year": float(vintage_year),
            "_revenue_growth": _f(latest, "ltm_sales_growth", default=0.08),
            "_ebitda_margin": _f(latest, "ebitda_margin_at_rd", default=0.20),
            "_holding_period": _f(latest, "holding_period", default=3.0),
            "_current_nav": exit_value_m,
            "_moic": nav_x,
        }

        company_row: Dict[str, Any] = {
            "id": company_id,
            "name": company_name,
            "sector": sector,
            "geography": geography,
            "status": status,
            "exit_date": exit_date,
            "cost_m": round(cost_m, 1),
            "proceeds_m": round(proceeds_m, 1),
            "nav_m": round(nav_m, 1),
            "exit_value_m": round(exit_value_m, 1),
            "cost_x": 1.0,
            "nav_x": nav_x,
            "quarterly_navs": quarterly_navs,
            **ml_fields,
        }

        company_index[company_id] = company_row

        # Accumulate into fund
        if fund_id not in funds_dict:
            funds_dict[fund_id] = {
                "id": fund_id,
                "name": fund_name,
                "deal_id": "",  # filled below
                "currency": _s(latest, "fund_currency", default="USD"),
                "committed_m": 0.0,
                "nav_m": 0.0,
                "vintage": vintage_year,
                "companies": [],
            }
        funds_dict[fund_id]["companies"].append(company_row)

    # ── Choose 6 most recent quarter keys ────────────────────────────────────
    sorted_qkeys = sorted(all_quarter_keys, key=_quarter_key_to_sort_key)
    quarter_keys = sorted_qkeys[-6:] if len(sorted_qkeys) >= 6 else sorted_qkeys

    # ── Fund roll-ups ─────────────────────────────────────────────────────────
    for fund in funds_dict.values():
        cos = fund["companies"]
        fund["committed_m"] = round(sum(c["cost_m"] for c in cos), 1)
        fund["nav_m"] = round(sum(c["nav_m"] + c["proceeds_m"] for c in cos), 1)

    # ── Deal groups ───────────────────────────────────────────────────────────
    all_fund_names = sorted(fund_id_by_name.keys())
    deals = _make_deal_groups(all_fund_names, gp_name_by_fund)

    # Build deal_id → fund_ids map and reverse-fill fund deal_id
    for deal in deals:
        fund_ids = deal["fund_ids"]
        all_cos: List[Dict[str, Any]] = []
        for fid in fund_ids:
            if fid in funds_dict:
                funds_dict[fid]["deal_id"] = deal["id"]
                all_cos.extend(funds_dict[fid]["companies"])

        deal["committed_m"] = round(sum(c["cost_m"] for c in all_cos), 1)
        deal["total_nav_m"] = round(sum(c["nav_m"] + c["proceeds_m"] for c in all_cos), 1)
        deal["total_companies"] = len(all_cos)

        moic_vals = [c["nav_x"] for c in all_cos if c["cost_m"] > 0]
        deal["moic"] = round(sum(moic_vals) / len(moic_vals), 2) if moic_vals else 1.0

        # Derive vintage from earliest fund in group
        vintages = [funds_dict[fid]["vintage"] for fid in fund_ids if fid in funds_dict]
        if vintages:
            deal["vintage"] = min(v for v in vintages if v)

    # Drop deals with no known funds (safety)
    deals = [d for d in deals if any(fid in funds_dict for fid in d["fund_ids"])]

    logger.info(
        "CSV parsed: %d deals, %d funds, %d companies, quarter_keys=%s",
        len(deals), len(funds_dict), len(company_index), quarter_keys,
    )

    return {
        "deals": deals,
        "funds": funds_dict,
        "quarter_keys": quarter_keys,
        "company_index": company_index,
    }


# ---------------------------------------------------------------------------
# Module-level cache
# ---------------------------------------------------------------------------

_cached_data: Optional[Dict[str, Any]] = None


def get_csv_data() -> Optional[Dict[str, Any]]:
    """Return cached CSV data, loading on first call."""
    global _cached_data
    if _cached_data is None:
        _cached_data = load_csv()
    return _cached_data


def invalidate_cache() -> None:
    """Force a reload on the next call to get_csv_data()."""
    global _cached_data
    _cached_data = None
    logger.info("CSV data cache invalidated")

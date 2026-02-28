"""
Funds router - endpoints for fund-level analytics.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from services.analytics import service

router = APIRouter(prefix="/api/funds", tags=["funds"])


@router.get("/", response_model=List[Dict[str, Any]])
async def get_funds() -> List[Dict[str, Any]]:
    """Return list of all funds with summary metrics."""
    return service.get_funds()


@router.get("/{fund_id}", response_model=Dict[str, Any])
async def get_fund(fund_id: str) -> Dict[str, Any]:
    """Return fund detail including DPI, TVPI, RVPI and portfolio stats."""
    fund = service.get_fund(fund_id)
    if fund is None:
        raise HTTPException(status_code=404, detail=f"Fund '{fund_id}' not found")
    return fund


@router.get("/{fund_id}/analytics", response_model=Dict[str, Any])
async def get_fund_analytics(fund_id: str) -> Dict[str, Any]:
    """
    Return detailed fund analytics including:
    - NAV history
    - DPI/TVPI/RVPI trajectories
    - Cashflow timeline
    - Company-level breakdown
    """
    analytics = service.get_fund_analytics(fund_id)
    if analytics is None:
        raise HTTPException(status_code=404, detail=f"Fund '{fund_id}' not found")
    return analytics


@router.get("/{fund_id}/monte-carlo", response_model=Dict[str, Any])
async def get_monte_carlo(
    fund_id: str,
    n_simulations: int = Query(500, ge=100, le=5000, description="Number of simulation paths"),
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation for fund-level return distribution.

    Returns fan chart data, exit schedule, NAV decay curves and
    percentile outcomes (P10/P50/P90) for DPI and TVPI.
    """
    result = service.get_monte_carlo(fund_id, n_simulations)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Fund '{fund_id}' not found")
    return result

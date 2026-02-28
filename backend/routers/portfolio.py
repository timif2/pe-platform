"""
Portfolio router - endpoints for portfolio-level operations.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from services.analytics import service

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("/", response_model=List[Dict[str, Any]])
async def get_portfolio(
    fund: Optional[str] = Query(None, description="Filter by fund name"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    geography: Optional[str] = Query(None, description="Filter by geography"),
    vintage_year: Optional[int] = Query(None, description="Filter by vintage year"),
    status: Optional[str] = Query(None, description="Filter by status: active | exited"),
    min_nav: Optional[float] = Query(None, description="Minimum NAV ($M)"),
    max_nav: Optional[float] = Query(None, description="Maximum NAV ($M)"),
) -> List[Dict[str, Any]]:
    """Return filtered list of portfolio companies."""
    filters: Dict[str, Any] = {}
    if fund is not None:
        filters["fund"] = fund
    if sector is not None:
        filters["sector"] = sector
    if geography is not None:
        filters["geography"] = geography
    if vintage_year is not None:
        filters["vintage_year"] = vintage_year
    if status is not None:
        filters["status"] = status
    if min_nav is not None:
        filters["min_nav"] = min_nav
    if max_nav is not None:
        filters["max_nav"] = max_nav

    return service.get_portfolio(filters if filters else None)


@router.get("/filters", response_model=Dict[str, Any])
async def get_filter_options() -> Dict[str, Any]:
    """Return all available filter values for portfolio filtering."""
    return service.get_filter_options()


@router.get("/summary", response_model=Dict[str, Any])
async def get_portfolio_summary() -> Dict[str, Any]:
    """Return aggregate portfolio statistics."""
    return service.get_portfolio_summary()

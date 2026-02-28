"""
Analytics router - endpoints for cross-portfolio analytics.
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query

from services.analytics import service

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/overview", response_model=Dict[str, Any])
async def get_overview() -> Dict[str, Any]:
    """
    Return dashboard overview data including:
    - Total portfolio NAV
    - Expected DPI and TVPI
    - Exits expected in next 24 months
    - Liquidity forecast
    - NAV history
    - MOIC distribution
    - Exit histogram
    - Fund breakdown
    """
    return service.get_overview()


@router.get("/survival", response_model=Dict[str, Any])
async def get_survival(
    group_by: str = Query(
        "sector",
        description="Group survival curves by: sector | geography | fund",
    )
) -> Dict[str, Any]:
    """
    Return survival analysis data including:
    - Kaplan-Meier curves by group
    - Hazard rates by sector
    - Exit heatmap (sector x vintage)
    """
    valid_group_bys = {"sector", "geography", "fund"}
    if group_by not in valid_group_bys:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid group_by '{group_by}'. Must be one of: {', '.join(sorted(valid_group_bys))}",
        )
    return service.get_survival_data(group_by)


@router.get("/explainability", response_model=Dict[str, Any])
async def get_explainability(
    company_id: str = Query(..., description="Company ID to explain predictions for"),
) -> Dict[str, Any]:
    """
    Return model explainability data for a company including:
    - Feature importance from the MOIC prediction model
    - SHAP-style feature contribution values for the specific company
    """
    result = service.get_explainability(company_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")
    return result

"""
Deals Router — three-level hierarchy: Transaction → Fund → Company.

Endpoints:
  GET  /api/deals                               – list all deals
  GET  /api/deals/{deal_id}                     – deal detail + fund list
  GET  /api/deals/{deal_id}/funds/{fund_id}/model – Primary Fund Model
  POST /api/deals/predict                        – run ML predictions
  POST /api/deals/reload-csv                     – invalidate CSV cache
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.deals import service
from data.csv_loader import invalidate_cache, CSV_PATH

logger = logging.getLogger("pe_analytics.deals")

router = APIRouter(prefix="/api/deals", tags=["deals"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    company_ids: List[str]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[Dict[str, Any]])
async def list_deals():
    """Return all deals (transactions) with high-level metrics."""
    try:
        return service.get_all_deals()
    except Exception as exc:
        logger.exception("list_deals failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{deal_id}", response_model=Dict[str, Any])
async def get_deal(deal_id: str):
    """Return a single deal with its fund list and portfolio metrics."""
    deal = service.get_deal(deal_id)
    if deal is None:
        raise HTTPException(status_code=404, detail=f"Deal '{deal_id}' not found")
    return deal


@router.get("/{deal_id}/funds/{fund_id}/model", response_model=Dict[str, Any])
async def get_fund_model(deal_id: str, fund_id: str):
    """
    Return the Primary Fund Model for a given fund within a deal.
    Includes company rows and an aggregation totals row.
    """
    model = service.get_fund_model(deal_id, fund_id)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail=f"Fund model for deal='{deal_id}' fund='{fund_id}' not found",
        )
    return model


@router.post("/predict", response_model=Dict[str, Any])
async def predict_companies(body: PredictRequest):
    """
    Run gradient boosting + survival model predictions for a list of companies.
    Returns per-company Exit Date, Cost X, NAV X.
    """
    if not body.company_ids:
        raise HTTPException(status_code=422, detail="company_ids must not be empty")
    try:
        return service.predict_companies(body.company_ids)
    except Exception as exc:
        logger.exception("predict_companies failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/reload-csv", response_model=Dict[str, Any])
async def reload_csv():
    """
    Invalidate the CSV data cache so the next request re-reads the file.
    Use this after replacing backend/data/portfolio_data.csv without restarting.
    """
    invalidate_cache()
    return {"reloaded": True, "csv_path": CSV_PATH}

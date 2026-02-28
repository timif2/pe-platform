"""
Companies router - endpoints for individual company operations.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from schemas.models import ChatMessage
from services.analytics import service

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("/{company_id}", response_model=Dict[str, Any])
async def get_company(company_id: str) -> Dict[str, Any]:
    """Return full company detail including financials, KPIs, SWOT and peers."""
    company = service.get_company(company_id)
    if company is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")
    return company


@router.get("/{company_id}/financials", response_model=Dict[str, Any])
async def get_company_financials(company_id: str) -> Dict[str, Any]:
    """Return financial history (revenue, EBITDA, valuation) for a company."""
    financials = service.get_financials(company_id)
    if financials is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")
    return financials


@router.get("/{company_id}/predictions", response_model=Dict[str, Any])
async def get_company_predictions(company_id: str) -> Dict[str, Any]:
    """
    Return ML-based exit and MOIC predictions for a company.

    Includes:
    - Survival curve (0-10 years)
    - Hazard rate
    - MOIC P10/P50/P90
    - Exit probability by year
    - Risk indicators
    """
    predictions = service.get_predictions(company_id)
    if predictions is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")
    return predictions


@router.get("/{company_id}/news", response_model=List[Dict[str, Any]])
async def get_company_news(company_id: str) -> List[Dict[str, Any]]:
    """Return news feed for a company."""
    # Validate company exists
    company = service.get_company(company_id)
    if company is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")
    return service.get_news(company_id)


@router.post("/{company_id}/business-plan", response_model=Dict[str, Any])
async def generate_business_plan(company_id: str) -> Dict[str, Any]:
    """Generate a structured business plan for a company."""
    plan = service.generate_business_plan(company_id)
    if plan is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")
    return plan


@router.post("/{company_id}/chat", response_model=Dict[str, Any])
async def chat_with_assistant(company_id: str, body: ChatMessage) -> Dict[str, Any]:
    """
    Chat with the AI analyst assistant about a specific company.

    The assistant provides analyst-style commentary based on company
    data, ML predictions and portfolio context.
    """
    # Validate company exists
    company = service.get_company(company_id)
    if company is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found")

    if not body.message or not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    return service.chat(company_id, body.message)

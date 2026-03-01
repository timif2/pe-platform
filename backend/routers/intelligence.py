"""
Company Intelligence Router
---------------------------
Endpoints for LLM-powered company analysis.  All heavy lifting is delegated to
services/intelligence.py which can be toggled between mock and Azure OpenAI via
the USE_MOCK_LLM environment variable.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from services.intelligence import (
    generate_company_sheet,
    generate_business_plan,
    answer_company_question,
)

logger = logging.getLogger("pe_analytics.intelligence")
router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])


# ──────────────────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────────────────

class CompanySheetRequest(BaseModel):
    company_name: str
    website: Optional[str] = None
    portfolio_data: Optional[Dict[str, Any]] = None  # pre-fetched portfolio record


class BusinessPlanRequest(BaseModel):
    company_name: str
    website: Optional[str] = None
    selected_metrics: List[str] = ["revenue", "ebitda", "net_debt"]
    portfolio_data: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    company_name: str
    question: str
    existing_context: Optional[str] = None  # serialised sheet/plan for richer answers


# ──────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────

@router.post("/company-sheet")
async def company_sheet(req: CompanySheetRequest) -> Dict[str, Any]:
    """
    Generate a structured company sheet.
    Returns sections: overview, description, financials, history,
    management, swot, debt_capital, corporate_events, projections,
    exit_view, exit_signals.
    """
    try:
        result = generate_company_sheet(
            company_name=req.company_name,
            website=req.website,
            document_context=None,
            portfolio_data=req.portfolio_data,
        )
        return {"status": "ok", "data": result}
    except Exception as exc:
        logger.exception("company_sheet failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/company-sheet-with-docs")
async def company_sheet_with_docs(
    company_name: str = Form(...),
    website: Optional[str] = Form(None),
    portfolio_data_json: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
) -> Dict[str, Any]:
    """
    Generate a company sheet incorporating uploaded documents as context.
    Accepts multipart/form-data with optional PDF/text file uploads.
    """
    import json as _json

    # Extract text from uploaded files (basic extraction – swap for azure doc intel)
    doc_parts: List[str] = []
    for f in files:
        try:
            raw = await f.read()
            # Attempt UTF-8 decode; skip binary PDFs gracefully (real impl uses Azure Doc Intel)
            try:
                doc_parts.append(raw.decode("utf-8", errors="ignore")[:8000])
            except Exception:
                doc_parts.append(f"[Binary file: {f.filename} – use Azure Document Intelligence for extraction]")
        except Exception:
            pass

    document_context = "\n\n---\n\n".join(doc_parts) if doc_parts else None

    portfolio_data = None
    if portfolio_data_json:
        try:
            portfolio_data = _json.loads(portfolio_data_json)
        except Exception:
            pass

    try:
        result = generate_company_sheet(
            company_name=company_name,
            website=website,
            document_context=document_context,
            portfolio_data=portfolio_data,
        )
        return {"status": "ok", "data": result}
    except Exception as exc:
        logger.exception("company_sheet_with_docs failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/business-plan")
async def business_plan(req: BusinessPlanRequest) -> Dict[str, Any]:
    """
    Generate a business plan with chosen financial metrics.
    selected_metrics can include: revenue, sales, ebitda, net_debt,
    ebitda_margin, revenue_growth, ebitda_cagr, sales_cagr, leverage.
    """
    try:
        result = generate_business_plan(
            company_name=req.company_name,
            website=req.website,
            selected_metrics=req.selected_metrics,
            portfolio_data=req.portfolio_data,
        )
        return {"status": "ok", "data": result}
    except Exception as exc:
        logger.exception("business_plan failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/chat")
async def chat(req: ChatRequest) -> Dict[str, str]:
    """Answer a free-form question about a company."""
    try:
        answer = answer_company_question(
            company_name=req.company_name,
            question=req.question,
            existing_context=req.existing_context,
        )
        return {"status": "ok", "answer": answer}
    except Exception as exc:
        logger.exception("chat failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

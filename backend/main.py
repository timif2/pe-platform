"""
PE Analytics Platform - FastAPI Application Entry Point

Institutional Private Equity Analytics Platform backend providing
portfolio analytics, ML-based exit predictions, fund-level Monte Carlo
simulations and AI-assisted company analysis.
"""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import portfolio, companies, funds, analytics, intelligence, deals

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("pe_analytics")


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - pre-generates data on startup."""
    logger.info("PE Analytics Platform starting up...")
    t0 = time.perf_counter()
    try:
        from data.synthetic_generator import get_data
        data = get_data()
        n_companies = len(data.get("companies", []))
        n_funds = len(data.get("funds", []))
        logger.info(
            "Synthetic data generated: %d companies across %d funds (%.2fs)",
            n_companies,
            n_funds,
            time.perf_counter() - t0,
        )

        # Pre-warm the analytics service (fits ML models)
        from services.analytics import service
        service._ensure_init()
        logger.info("ML models fitted in %.2fs", time.perf_counter() - t0)

    except Exception as exc:
        logger.exception("Startup data generation failed: %s", exc)

    yield

    logger.info("PE Analytics Platform shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PE Analytics Platform",
    description=(
        "Institutional Private Equity Analytics Platform providing portfolio analytics, "
        "ML-based exit predictions, fund-level Monte Carlo simulations and AI-assisted "
        "company analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(portfolio.router)
app.include_router(companies.router)
app.include_router(funds.router)
app.include_router(analytics.router)
app.include_router(intelligence.router)
app.include_router(deals.router)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": str(request.url.path),
        },
    )


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
async def root() -> Dict[str, Any]:
    """API health check and metadata."""
    return {
        "name": "PE Analytics Platform API",
        "version": "1.0.0",
        "status": "operational",
        "description": "Institutional Private Equity Analytics Platform",
        "endpoints": {
            "portfolio": "/api/portfolio",
            "companies": "/api/companies/{id}",
            "funds": "/api/funds",
            "overview": "/api/overview",
            "survival": "/api/survival",
            "explainability": "/api/explainability",
            "intelligence": "/api/intelligence",
            "docs": "/docs",
            "redoc": "/redoc",
        },
    }


@app.get("/health", tags=["health"])
async def health_check() -> Dict[str, str]:
    """Kubernetes/Docker health check endpoint."""
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Development entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

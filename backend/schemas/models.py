"""
Pydantic v2 schemas for PE Analytics Platform API responses.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Portfolio / Company schemas
# ---------------------------------------------------------------------------

class CompanySummary(BaseModel):
    id: str
    name: str
    fund: str
    vintage_year: int
    sector: str
    geography: str
    status: str  # "active" | "exited"
    entry_ev: float
    current_nav: float
    moic_current: float
    holding_period: float
    revenue_growth: float
    ebitda_margin: float


class ManagementMember(BaseModel):
    name: str
    title: str
    tenure: int


class PeerCompany(BaseModel):
    name: str
    ev_ebitda: float
    revenue_growth: float
    ebitda_margin: float


class NewsItem(BaseModel):
    id: str
    title: str
    date: str
    source: str
    summary: str
    sentiment: str  # "positive" | "neutral" | "negative"
    sentiment_score: float


class SWOTAnalysis(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


class CompanyDetail(CompanySummary):
    fund_id: str
    country: str
    entry_date: str
    exit_date: Optional[str] = None
    exit_ev: Optional[float] = None
    exit_moic: Optional[float] = None
    exit_type: Optional[str] = None
    description: str
    investment_thesis: str
    management: List[ManagementMember]
    financials: Dict[str, Any]
    kpis: Dict[str, Any]
    swot: SWOTAnalysis
    peers: List[PeerCompany]
    news: List[NewsItem]


# ---------------------------------------------------------------------------
# Financial History
# ---------------------------------------------------------------------------

class FinancialHistory(BaseModel):
    years: List[int]
    revenue: List[float]
    ebitda: List[float]
    valuation: List[float]
    revenue_growth: List[float]
    ebitda_margin: List[float]


# ---------------------------------------------------------------------------
# Prediction / ML schemas
# ---------------------------------------------------------------------------

class SurvivalPoint(BaseModel):
    time: float
    survival_prob: float


class RiskIndicator(BaseModel):
    name: str
    level: str   # "low" | "medium" | "high"
    score: float
    description: str


class PredictionResult(BaseModel):
    survival_curve: List[SurvivalPoint]
    hazard_rate: float
    moic_p10: float
    moic_p50: float
    moic_p90: float
    exit_probability_by_year: Dict[str, float]
    risk_indicators: List[RiskIndicator]


# ---------------------------------------------------------------------------
# Fund schemas
# ---------------------------------------------------------------------------

class FundSummary(BaseModel):
    id: str
    name: str
    vintage_year: int
    strategy: str
    committed_capital: float
    deployed_capital: float
    nav: float
    dpi: float
    tvpi: float
    rvpi: float
    num_companies: int
    num_exits: int


class CashflowPoint(BaseModel):
    year: int
    investment: float
    distributions: float
    net_cashflow: float


class CompanyBreakdownItem(BaseModel):
    company_id: str
    name: str
    nav: float
    moic: float
    status: str


class FundAnalytics(BaseModel):
    fund_id: str
    nav_history: List[Dict[str, Any]]
    dpi_trajectory: List[Dict[str, Any]]
    tvpi_trajectory: List[Dict[str, Any]]
    cashflow_timeline: List[CashflowPoint]
    company_breakdown: List[CompanyBreakdownItem]


# ---------------------------------------------------------------------------
# Monte Carlo
# ---------------------------------------------------------------------------

class FanChartPoint(BaseModel):
    year: int
    p10_dpi: float
    p25_dpi: float
    p50_dpi: float
    p75_dpi: float
    p90_dpi: float


class NavDecayPoint(BaseModel):
    year: int
    nav_mean: float
    nav_p10: float
    nav_p90: float


class ExitSchedulePoint(BaseModel):
    year: int
    expected_exits: float
    expected_capital_returned: float


class MonteCarloResult(BaseModel):
    percentile_10: Dict[str, Any]
    percentile_50: Dict[str, Any]
    percentile_90: Dict[str, Any]
    mean_dpi: float
    mean_tvpi: float
    nav_decay: List[NavDecayPoint]
    fan_chart_data: List[FanChartPoint]
    exit_schedule: List[ExitSchedulePoint]


# ---------------------------------------------------------------------------
# Survival Analysis
# ---------------------------------------------------------------------------

class SurvivalData(BaseModel):
    km_curves: Dict[str, Any]        # group -> [{time, survival}]
    hazard_rates: Dict[str, Any]     # sector -> hazard rate
    exit_heatmap: Dict[str, Any]     # matrix data


# ---------------------------------------------------------------------------
# Explainability
# ---------------------------------------------------------------------------

class FeatureImportance(BaseModel):
    feature: str
    importance: float


class ShapValue(BaseModel):
    feature: str
    value: float
    contribution: float


class ExplainabilityData(BaseModel):
    feature_importance: List[FeatureImportance]
    shap_values: List[ShapValue]
    company_id: str


# ---------------------------------------------------------------------------
# Overview Dashboard
# ---------------------------------------------------------------------------

class OverviewData(BaseModel):
    portfolio_nav: float
    expected_dpi: float
    expected_tvpi: float
    exits_next_24m: int
    liquidity_forecast: float
    nav_history: List[Dict[str, Any]]
    moic_distribution: List[Dict[str, Any]]
    exit_histogram: List[Dict[str, Any]]
    fund_breakdown: List[Dict[str, Any]]


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    company_id: Optional[str] = None
    context_used: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Business Plan
# ---------------------------------------------------------------------------

class BusinessPlan(BaseModel):
    company_id: str
    executive_summary: str
    market_positioning: str
    growth_strategy: str
    operational_initiatives: str
    value_creation_plan: str
    exit_strategy: str
    timeline: Dict[str, Any]

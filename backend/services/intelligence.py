"""
Company Intelligence Service
----------------------------
All LLM calls are centralised here.  The service reads USE_MOCK_LLM from the
environment:
  - USE_MOCK_LLM=true  → returns deterministic mock data (default, no API key needed)
  - USE_MOCK_LLM=false → calls Azure OpenAI via the openai SDK

To switch to real Azure OpenAI:
  1. Copy backend/.env.example to backend/.env and fill in your credentials
  2. Set USE_MOCK_LLM=false in .env
  3. pip install openai python-dotenv

The function signatures and return shapes are identical in both modes, so the
router layer never needs to change.
"""

import os
import json
import textwrap
from typing import Optional

# Load .env if present (no-op when running in production with real env vars)
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass  # python-dotenv not installed – rely on real env vars

USE_MOCK = os.getenv("USE_MOCK_LLM", "true").lower() != "false"


# ──────────────────────────────────────────────────────────
# Azure OpenAI client (lazy-initialised only when needed)
# ──────────────────────────────────────────────────────────

_azure_client = None

def _get_azure_client():
    global _azure_client
    if _azure_client is not None:
        return _azure_client
    try:
        from openai import AzureOpenAI
        _azure_client = AzureOpenAI(
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
        )
        return _azure_client
    except Exception as e:
        raise RuntimeError(f"Azure OpenAI client init failed: {e}") from e


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Send a chat completion request to Azure OpenAI."""
    client = _get_azure_client()
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=4096,
    )
    return response.choices[0].message.content


# ──────────────────────────────────────────────────────────
# Public service functions
# ──────────────────────────────────────────────────────────

def generate_company_sheet(
    company_name: str,
    website: Optional[str],
    document_context: Optional[str],
    portfolio_data: Optional[dict],
) -> dict:
    """
    Generate a structured company sheet.
    Returns a dict with sections: overview, description, financials, history,
    management, swot, debt_capital, corporate_events, projections, exit_view,
    exit_signals.
    """
    if USE_MOCK:
        return _mock_company_sheet(company_name, portfolio_data)

    # Build context block
    context_parts = []
    if website:
        context_parts.append(f"Company website: {website}")
    if document_context:
        context_parts.append(f"Uploaded document excerpts:\n{document_context}")
    if portfolio_data:
        context_parts.append(f"Internal portfolio data:\n{json.dumps(portfolio_data, indent=2)}")
    context = "\n\n".join(context_parts) if context_parts else "No additional context provided."

    system_prompt = textwrap.dedent("""
        You are a senior private equity analyst producing a comprehensive company sheet.
        Return a JSON object with exactly these keys:
        overview, description, financials, history, management, swot,
        debt_capital, corporate_events, projections, exit_view, exit_signals.
        Each value should be a concise, professional string or structured object.
        For swot, return {strengths, weaknesses, opportunities, threats} strings.
        For financials, return a list of {year, revenue, ebitda, net_debt} objects.
        For management, return a list of {name, title, notes} objects.
        For exit_signals, return a list of signal strings.
    """)
    user_prompt = f"Produce a company sheet for: {company_name}\n\nContext:\n{context}"

    raw = _call_llm(system_prompt, user_prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Return raw text wrapped in overview if JSON parsing fails
        return {"overview": raw, "error": "LLM returned non-JSON – raw text shown in overview"}


def generate_business_plan(
    company_name: str,
    website: Optional[str],
    selected_metrics: list[str],
    portfolio_data: Optional[dict],
) -> dict:
    """
    Generate a business plan with chosen financial metrics.
    selected_metrics: e.g. ["ebitda", "sales", "net_debt", "ebitda_cagr", "sales_cagr"]
    Returns: {summary, market_analysis, strategy, financials, risks, conclusion}
    """
    if USE_MOCK:
        return _mock_business_plan(company_name, selected_metrics, portfolio_data)

    metrics_str = ", ".join(selected_metrics) if selected_metrics else "EBITDA, Revenue, Net Debt"
    context_parts = []
    if website:
        context_parts.append(f"Company website: {website}")
    if portfolio_data:
        context_parts.append(f"Internal portfolio data:\n{json.dumps(portfolio_data, indent=2)}")
    context = "\n\n".join(context_parts) if context_parts else "No additional context provided."

    system_prompt = textwrap.dedent("""
        You are a senior private equity analyst producing a business plan.
        Return a JSON object with keys:
        summary, market_analysis, strategy, financials, risks, conclusion.
        The financials key should be a list of annual projection objects containing
        the requested metrics plus the year.
        Source financial data from publicly available information where possible.
    """)
    user_prompt = (
        f"Produce a business plan for: {company_name}\n"
        f"Focus these financial metrics: {metrics_str}\n"
        f"Context:\n{context}"
    )

    raw = _call_llm(system_prompt, user_prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"summary": raw, "error": "LLM returned non-JSON"}


def answer_company_question(
    company_name: str,
    question: str,
    existing_context: Optional[str],
) -> str:
    """Answer a free-form question about a company."""
    if USE_MOCK:
        return _mock_chat_answer(company_name, question)

    system_prompt = (
        "You are a private equity research analyst. Answer questions about companies "
        "concisely and professionally, citing data where available."
    )
    context_block = f"\n\nExisting research context:\n{existing_context}" if existing_context else ""
    user_prompt = f"Company: {company_name}{context_block}\n\nQuestion: {question}"

    return _call_llm(system_prompt, user_prompt)


# ──────────────────────────────────────────────────────────
# Mock data – realistic PE-style content
# ──────────────────────────────────────────────────────────

def _mock_company_sheet(company_name: str, portfolio_data: Optional[dict]) -> dict:
    pd = portfolio_data or {}
    rev = pd.get("entry_revenue", 120)
    ebitda = pd.get("entry_ebitda", 30)
    ev = pd.get("entry_ev", 400)
    sector = pd.get("sector", "Technology")
    geo = pd.get("geography", "Europe")

    return {
        "overview": (
            f"{company_name} is a {sector} business headquartered in {geo}. "
            f"The company was founded in 2005 and has grown to become a market leader "
            f"in its core vertical. Revenue of €{rev}M with EBITDA of €{ebitda}M reflects "
            f"a margin profile consistent with best-in-class peers."
        ),
        "description": (
            f"{company_name} operates a B2B SaaS and professional services model serving "
            f"mid-market and enterprise clients across {geo}. Its proprietary platform "
            f"underpins mission-critical workflows for over 600 clients, driving high switching "
            f"costs and predictable recurring revenues (ARR ~78% of total). The business "
            f"has demonstrated consistent double-digit organic growth, supplemented by two "
            f"bolt-on acquisitions completed in 2021 and 2023."
        ),
        "financials": [
            {"year": 2021, "revenue": round(rev * 0.72, 1), "ebitda": round(ebitda * 0.68, 1), "net_debt": round(ev * 1.4, 0)},
            {"year": 2022, "revenue": round(rev * 0.85, 1), "ebitda": round(ebitda * 0.83, 1), "net_debt": round(ev * 1.25, 0)},
            {"year": 2023, "revenue": round(rev * 0.94, 1), "ebitda": round(ebitda * 0.91, 1), "net_debt": round(ev * 1.1, 0)},
            {"year": 2024, "revenue": round(rev, 1),        "ebitda": round(ebitda, 1),         "net_debt": round(ev * 0.95, 0)},
        ],
        "history": (
            f"{company_name} was founded in 2005 by a team of industry veterans. "
            f"The company bootstrapped to €{round(rev * 0.2, 0)}M revenue by 2012, "
            f"after which it raised a Series A from a European growth equity fund. "
            f"Following two strategic acquisitions the business attracted secondary interest "
            f"and was acquired by the current sponsor in 2020 at {round(ev / ebitda, 1)}x EV/EBITDA. "
            f"Since acquisition, headcount has grown from 280 to 520 FTEs."
        ),
        "management": [
            {"name": "Thomas Brandt", "title": "Chief Executive Officer", "notes": "15 years industry tenure; led two prior PE-backed exits"},
            {"name": "Amélie Fontaine", "title": "Chief Financial Officer", "notes": "Former Big 4 partner; joined post-acquisition in 2021"},
            {"name": "David Osei", "title": "Chief Technology Officer", "notes": "PhD Computer Science; holds 4 patents; joined 2019"},
            {"name": "Katarina Novak", "title": "Chief Revenue Officer", "notes": "Previously VP Sales at a NASDAQ-listed SaaS peer"},
        ],
        "swot": {
            "strengths": (
                f"Market-leading NPS of 68; sticky recurring revenue base (~78% ARR); "
                f"proprietary data moat from 10+ years of client interactions; "
                f"experienced management team with strong PE pedigree."
            ),
            "weaknesses": (
                f"Top-10 client concentration represents 42% of ARR; "
                f"EBITDA margin of {round(ebitda / rev * 100, 1)}% lags US-listed peers by ~5pp; "
                f"limited international footprint outside core {geo} markets."
            ),
            "opportunities": (
                f"DACH and Nordics geographic expansion (combined TAM €2.1B); "
                f"AI-augmented product tier commanding 30–40% price premium; "
                f"platform M&A of 2–3 complementary point solutions."
            ),
            "threats": (
                f"Big-tech incumbents (Microsoft, Salesforce) extending into adjacencies; "
                f"macro softness delaying enterprise procurement cycles; "
                f"key-person dependency on founding CTO."
            ),
        },
        "debt_capital": (
            f"Capital structure at entry: Senior secured term loan €{round(ev * 0.55, 0)}M "
            f"(EURIBOR + 425bps), RCF €{round(ev * 0.12, 0)}M (undrawn). "
            f"Net leverage at entry: {round((ev * 0.55) / ebitda, 1)}x Net Debt/EBITDA. "
            f"Covenant-lite with springing maintenance covenant on RCF at 9.0x. "
            f"Current net leverage: {round((ev * 0.35) / ebitda, 1)}x following two years of "
            f"strong FCF conversion (92% on average)."
        ),
        "corporate_events": (
            f"2021: Acquired DataBridge GmbH (€28M EV) – expanded {geo} footprint.\n"
            f"2022: Refinanced senior facility, extending maturity to 2028 and saving 75bps.\n"
            f"2023: Acquired NexusSoft (€19M EV) – added AI workflow capabilities.\n"
            f"2024: Launched AI-Pro tier; signed first US enterprise pilot client."
        ),
        "projections": (
            f"FY2025E: Revenue €{round(rev * 1.14, 1)}M (+14% YoY), EBITDA €{round(ebitda * 1.20, 1)}M, margin {round(ebitda * 1.20 / (rev * 1.14) * 100, 1)}%.\n"
            f"FY2026E: Revenue €{round(rev * 1.28, 1)}M (+12% YoY), EBITDA €{round(ebitda * 1.38, 1)}M, margin {round(ebitda * 1.38 / (rev * 1.28) * 100, 1)}%.\n"
            f"FY2027E: Revenue €{round(rev * 1.42, 1)}M (+11% YoY), EBITDA €{round(ebitda * 1.56, 1)}M, margin {round(ebitda * 1.56 / (rev * 1.42) * 100, 1)}%.\n"
            f"Key assumptions: Organic growth 10–14%, AI-Pro tier contributes +2pp margin annually, "
            f"M&A optionality not included in base case."
        ),
        "exit_view": (
            f"Primary exit route: strategic sale to a large-cap technology group or listed SaaS player "
            f"(indicative EV/EBITDA 18–22x on 2027E). Secondary route: sponsor-to-sponsor at "
            f"15–18x. IPO optionality exists if public markets re-rate SaaS peers above 20x NTM EBITDA. "
            f"Target hold period: 5–6 years from entry (exit window 2025–2026). "
            f"Base case MOIC: {round(ev * 1.9 / (ev * 0.45), 2)}x | Gross IRR: ~28%."
        ),
        "exit_signals": [
            "EBITDA margin sustainably above 30% for 2 consecutive years",
            "ARR exceeds €100M with NRR >115%",
            "Successful US market entry generating >10% of revenue",
            "AI-Pro tier achieving >20% of total ARR",
            "Inbound strategic interest from 2+ potential acquirers",
            "Net leverage below 2.0x Net Debt/EBITDA",
        ],
    }


def _mock_business_plan(company_name: str, selected_metrics: list, portfolio_data: Optional[dict]) -> dict:
    pd = portfolio_data or {}
    rev = pd.get("entry_revenue", 120)
    ebitda = pd.get("entry_ebitda", 30)
    net_debt = pd.get("entry_ev", 400) * 0.55
    sector = pd.get("sector", "Technology")

    # Build financial projections for requested metrics
    years = [2024, 2025, 2026, 2027, 2028]
    rev_base = rev
    ebitda_base = ebitda
    debt_base = net_debt

    financials = []
    for i, yr in enumerate(years):
        growth = 1.0 + (0.14 - i * 0.01)  # decelerating growth
        rev_base = rev_base * growth
        ebitda_base = ebitda_base * (growth + 0.02)
        debt_base = debt_base * 0.88  # deleveraging
        row = {"year": yr}
        metric_map = {
            "revenue": round(rev_base, 1),
            "sales": round(rev_base, 1),
            "ebitda": round(ebitda_base, 1),
            "net_debt": round(debt_base, 1),
            "ebitda_margin": round(ebitda_base / rev_base * 100, 1),
            "revenue_growth": round((growth - 1) * 100, 1),
            "sales_growth": round((growth - 1) * 100, 1),
            "ebitda_cagr": round((growth + 0.01) * 100 - 100, 1),
            "sales_cagr": round((growth - 1) * 100, 1),
            "leverage": round(debt_base / ebitda_base, 2),
        }
        for m in (selected_metrics or ["revenue", "ebitda", "net_debt"]):
            key = m.lower().replace(" ", "_")
            if key in metric_map:
                row[key] = metric_map[key]
        financials.append(row)

    return {
        "summary": (
            f"{company_name} is a {sector} business with a compelling growth profile and "
            f"clear path to value creation. This business plan projects {company_name} "
            f"achieving €{round(financials[-1].get('revenue', rev * 1.6), 0)}M revenue and "
            f"€{round(financials[-1].get('ebitda', ebitda * 1.8), 0)}M EBITDA by 2028 "
            f"through organic growth and strategic initiatives."
        ),
        "market_analysis": (
            f"The addressable market for {company_name}'s core product is estimated at €8.4B "
            f"in Europe, growing at ~11% CAGR. The company currently holds ~1.4% market share, "
            f"providing significant white-space for expansion. Key demand drivers include "
            f"digital transformation spend, regulatory tailwinds, and AI adoption cycles. "
            f"Competitive intensity is moderate; the top-5 players hold ~35% combined share."
        ),
        "strategy": (
            "Three strategic pillars underpin the plan:\n"
            "1. **Organic Growth**: Deepen penetration in existing verticals through expanded "
            "sales force (target +15 quota-carrying reps by 2025) and AI-augmented product suite.\n"
            "2. **Geographic Expansion**: Enter DACH and Nordics markets via channel partnerships "
            "in 2025, targeting €12M incremental ARR by 2026.\n"
            "3. **M&A**: Pursue 1–2 bolt-on acquisitions (€20–40M EV each) of complementary "
            "point solutions to extend platform capabilities and accelerate land-and-expand."
        ),
        "financials": financials,
        "risks": (
            "Key risks and mitigants:\n"
            "• **Macro slowdown** – Mitigant: 78% recurring revenue, multi-year contracts; "
            "stress-tested to -20% new logo ARR.\n"
            "• **Execution risk on geographic expansion** – Mitigant: Channel-first model "
            "limits upfront capex; market entry can be paused without material cost.\n"
            "• **M&A integration** – Mitigant: Dedicated integration PMO; bolt-ons sized "
            "to avoid over-stretch (max 0.5x leverage turn per deal).\n"
            "• **AI product risk** – Mitigant: AI-Pro is additive tier, not a replacement; "
            "core platform revenue protected regardless of AI adoption rate."
        ),
        "conclusion": (
            f"On the base case, {company_name} delivers a gross MOIC of ~2.5x and IRR of ~25% "
            f"over a 5-year hold from a 2024 entry. The business plan is achievable with "
            f"management's existing capabilities and the sponsor's operational support. "
            f"Upside scenario (faster AI adoption + M&A) could yield 3.0–3.5x. "
            f"Downside scenario (macro stress) still achieves 1.8–2.0x with full debt repayment."
        ),
    }


def _mock_chat_answer(company_name: str, question: str) -> str:
    q_lower = question.lower()
    if any(w in q_lower for w in ["revenue", "sales", "turnover"]):
        return (
            f"{company_name} generated approximately €120M in revenue in FY2024, "
            f"representing 14% year-over-year growth. The business is approximately 78% "
            f"recurring (ARR), providing strong revenue visibility."
        )
    if any(w in q_lower for w in ["ebitda", "margin", "profit"]):
        return (
            f"{company_name}'s EBITDA was €30M in FY2024 (25% margin). "
            f"Management is targeting 28–30% EBITDA margin by 2026 through "
            f"operating leverage on the SaaS platform and reduced one-off costs."
        )
    if any(w in q_lower for w in ["exit", "sale", "ipo", "moic", "irr"]):
        return (
            f"The primary exit route for {company_name} is a strategic sale at 18–22x EV/EBITDA, "
            f"targeting a 2025–2026 window. Base case MOIC is ~2.4x with a gross IRR of ~27%. "
            f"Secondary routes include a sponsor-to-sponsor transaction or, longer term, an IPO."
        )
    if any(w in q_lower for w in ["debt", "leverage", "capital", "structure"]):
        return (
            f"{company_name} carries a senior secured term loan of ~€220M (EURIBOR + 425bps) "
            f"and an undrawn RCF of €48M. Net leverage is currently ~2.8x Net Debt/EBITDA, "
            f"down from 4.6x at entry, driven by strong FCF conversion averaging 92%."
        )
    if any(w in q_lower for w in ["management", "team", "ceo", "cfo"]):
        return (
            f"{company_name} is led by CEO Thomas Brandt (15 years industry tenure) and "
            f"CFO Amélie Fontaine (joined 2021, former Big 4 partner). The management team "
            f"holds a meaningful equity stake and is incentivised on MOIC and IRR hurdles."
        )
    if any(w in q_lower for w in ["swot", "strength", "weakness", "risk", "threat"]):
        return (
            f"Key strengths: sticky ARR (~78%), market-leading NPS, proprietary data moat. "
            f"Key risks: client concentration (top 10 = 42% ARR), limited US presence, "
            f"big-tech competitive pressure. Mitigants include multi-year contracts and "
            f"high switching costs embedded in client workflows."
        )
    # Generic fallback
    return (
        f"Based on available information, {company_name} is a high-quality {question.split()[0] if question else 'business'} "
        f"with strong fundamentals. For more specific analysis, please generate a Company Sheet "
        f"or Business Plan using the tools above, or refine your question."
    )

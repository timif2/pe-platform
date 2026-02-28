# Data Lab

An internal institutional-grade analytics platform for PE professionals to perform fund and company level analysis.

## Quick Start

### Option 1: One-click launch (Windows)
```
Double-click start_all.bat
```
This starts both backend and frontend servers automatically.

### Option 2: Manual launch

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Platform Sections

| Page | URL | Description |
|------|-----|-------------|
| Overview Dashboard | `/` | Portfolio-level KPIs, NAV evolution, cash flow projections |
| Portfolio Explorer | `/portfolio` | Browse and filter all portfolio companies |
| Company Sheet | `/portfolio/:id` | Investment memo-style company detail page |
| Predictions Lab | `/predictions` | Exit timing & MOIC prediction engine |
| Fund Analytics | `/fund-analytics` | Monte Carlo fund-level simulations |
| Survival Analysis | `/survival` | Kaplan-Meier curves by sector/vintage |
| Explainability Lab | `/explainability` | SHAP values & feature importance |

---
d
## Architecture

```
pe-analytics/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point
│   ├── requirements.txt        # Python dependencies
│   ├── data/
│   │   └── synthetic_generator.py  # Generates realistic PE portfolio data
│   ├── models/
│   │   ├── survival_model.py   # Kaplan-Meier & Cox PH survival analysis
│   │   ├── moic_model.py       # LightGBM MOIC prediction
│   │   └── monte_carlo.py      # Monte Carlo fund simulation
│   ├── routers/
│   │   ├── portfolio.py        # Portfolio list endpoints
│   │   ├── companies.py        # Company detail endpoints
│   │   ├── funds.py            # Fund analytics endpoints
│   │   └── analytics.py        # Overview, survival, explainability
│   ├── schemas/
│   │   └── models.py           # Pydantic response models
│   └── services/
│       └── analytics.py        # Business logic orchestration
│
└── frontend/                   # React + Vite frontend
    ├── src/
    │   ├── App.jsx             # Router and layout
    │   ├── api/index.js        # Axios API client
    │   ├── components/
    │   │   ├── Layout/         # Sidebar, TopBar
    │   │   ├── charts/         # FanChart, SurvivalCurve, SHAP, MOIC
    │   │   └── common/         # KPICard, DataTable, LoadingState
    │   └── pages/
    │       ├── Overview.jsx
    │       ├── Portfolio.jsx
    │       ├── CompanySheet.jsx
    │       ├── PredictionsLab.jsx
    │       ├── FundAnalytics.jsx
    │       ├── SurvivalAnalysis.jsx
    │       └── Explainability.jsx
    └── package.json
```

---

## Data Model

The platform uses **synthetic data** generated on startup (seed=42, reproducible).

**Portfolio:**
- 3 Funds: Meridian Capital Fund I (2017), Fund II (2020), Fund III (2022)
- 45 portfolio companies across Technology, Healthcare, Industrials, Consumer, Financial Services

**ML Models:**
- **Exit Timing**: Kaplan-Meier + Cox Proportional Hazards survival model
- **MOIC**: Gradient Boosting quantile regression (P10/P50/P90)
- **Fund Analytics**: Monte Carlo simulation (N=500 default)
- **Explainability**: SHAP values + feature importance

---

## API Documentation

With the backend running, visit **http://localhost:8000/docs** for the full Swagger UI.

### Key Endpoints

```
GET  /api/overview                   - Dashboard metrics
GET  /api/portfolio/                 - Company list (with filters)
GET  /api/companies/{id}             - Company detail
GET  /api/companies/{id}/predictions - Exit & MOIC predictions
POST /api/companies/{id}/business-plan - Generate AI business plan
POST /api/companies/{id}/chat        - AI analyst chat
GET  /api/funds/                     - Fund list
GET  /api/funds/{id}/monte-carlo     - Run Monte Carlo simulation
GET  /api/survival                   - Survival analysis data
GET  /api/explainability             - SHAP/feature importance
```

---

## Future Integrations (Planned)

- **Claude API**: Real LLM-powered analyst responses and business plans
- **Bloomberg / Refinitiv**: Live financial data feeds
- **PitchBook / Preqin**: Market benchmark data
- **News APIs**: Real-time sentiment analysis
- **Document AI**: PDF ingestion for CIM / IC memos

---

## Design Philosophy

> "Institutional research terminal, not startup dashboard."

- White background with soft grey panels
- Dense but elegant information layout
- Bloomberg/FactSet aesthetic throughout
- Investment-committee ready visuals
- Monospace fonts for financial data

---

## Requirements

- Python 3.10+
- Node.js 18+
- npm 9+

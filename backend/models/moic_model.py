"""
MOIC Prediction Model for PE Portfolio Companies.

Uses sklearn GradientBoostingRegressor with quantile loss to predict
P10/P50/P90 MOIC outcomes. Falls back gracefully if lightgbm is not installed.
"""
from __future__ import annotations

import warnings
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

SECTOR_ORDER = ["Technology", "Healthcare", "Industrials", "Consumer", "Financial Services", "Energy"]
GEO_ORDER = ["North America", "Europe", "Asia Pacific"]

FEATURE_NAMES = [
    "entry_ev",
    "entry_ebitda",
    "entry_leverage",
    "entry_ev_ebitda",
    "sector_encoded",
    "geography_encoded",
    "vintage_year",
    "revenue_growth",
    "ebitda_margin",
    "holding_period",
]

FEATURE_DISPLAY_NAMES = {
    "entry_ev": "Entry EV ($M)",
    "entry_ebitda": "Entry EBITDA ($M)",
    "entry_leverage": "Entry Leverage (x)",
    "entry_ev_ebitda": "Entry EV/EBITDA (x)",
    "sector_encoded": "Sector",
    "geography_encoded": "Geography",
    "vintage_year": "Vintage Year",
    "revenue_growth": "Revenue Growth (TTM)",
    "ebitda_margin": "EBITDA Margin",
    "holding_period": "Holding Period (yrs)",
}


def _encode_sector(sector: str) -> float:
    try:
        return float(SECTOR_ORDER.index(sector))
    except ValueError:
        return 0.0


def _encode_geography(geo: str) -> float:
    try:
        return float(GEO_ORDER.index(geo))
    except ValueError:
        return 0.0


def _extract_features(company: Dict[str, Any]) -> np.ndarray:
    """Extract feature vector from a company dict."""
    kpis = company.get("kpis", {})

    # Revenue growth: prefer TTM from kpis, fallback to financials
    rev_growth = kpis.get("revenue_growth_ttm", company.get("revenue_growth", 0.12))
    fin = company.get("financials", {})
    fin_rev_growth = fin.get("revenue_growth", [])
    if isinstance(fin_rev_growth, list) and len(fin_rev_growth) >= 2:
        # Use average of last 2 years
        rev_growth = float(np.mean([g for g in fin_rev_growth[-2:] if g != 0])) if any(g != 0 for g in fin_rev_growth[-2:]) else rev_growth

    ebitda_margin = kpis.get("ebitda_margin", company.get("ebitda_margin", 0.25))

    features = [
        float(company.get("entry_ev", 300.0)),
        float(company.get("entry_ebitda", 40.0)),
        float(company.get("entry_leverage", 4.0)),
        float(company.get("entry_ev_ebitda", 8.0)),
        _encode_sector(company.get("sector", "Technology")),
        _encode_geography(company.get("geography", "North America")),
        float(company.get("vintage_year", 2018)),
        float(rev_growth),
        float(ebitda_margin),
        float(company.get("holding_period", 3.0)),
    ]
    return np.array(features, dtype=float)


# ---------------------------------------------------------------------------
# MOICModel
# ---------------------------------------------------------------------------

class MOICModel:
    """Quantile regression model for MOIC prediction."""

    QUANTILES = {"p10": 0.10, "p50": 0.50, "p90": 0.90}

    def __init__(self):
        self._models: Dict[str, GradientBoostingRegressor] = {}
        self._fitted = False
        self._feature_importances: Optional[np.ndarray] = None
        self._train_X: Optional[np.ndarray] = None
        self._train_y: Optional[np.ndarray] = None
        self._all_companies: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # Fit
    # ------------------------------------------------------------------

    def fit(self, companies: List[Dict[str, Any]]) -> "MOICModel":
        """Train quantile regression models on exited companies."""
        self._all_companies = companies

        exited = [c for c in companies if c.get("status") == "exited" and c.get("exit_moic") is not None]

        if len(exited) < 5:
            # Not enough data: create synthetic training samples from all companies
            exited = self._augment_training_data(companies)

        X = np.array([_extract_features(c) for c in exited], dtype=float)
        y = np.array([float(c.get("exit_moic", c.get("moic_current", 2.0))) for c in exited], dtype=float)

        # Replace NaN/inf
        X = np.nan_to_num(X, nan=0.0, posinf=10.0, neginf=0.0)
        y = np.nan_to_num(y, nan=2.0, posinf=5.0, neginf=0.5)

        self._train_X = X
        self._train_y = y

        for label, alpha in self.QUANTILES.items():
            model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=3,
                learning_rate=0.1,
                loss="quantile",
                alpha=alpha,
                random_state=42,
                subsample=0.8,
            )
            model.fit(X, y)
            self._models[label] = model

        # Feature importance from p50 model
        self._feature_importances = self._models["p50"].feature_importances_
        self._fitted = True
        return self

    def _augment_training_data(self, companies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        When insufficient exited companies exist, generate augmented training
        samples by projecting active companies to expected exit outcomes.
        """
        augmented = []
        rng = np.random.default_rng(42)

        # Start with real exited data
        for c in companies:
            if c.get("status") == "exited" and c.get("exit_moic") is not None:
                augmented.append(c)

        # Augment with projected outcomes from active companies
        for c in companies:
            if c.get("status") == "active":
                current_moic = float(c.get("moic_current", 1.5))
                hp = float(c.get("holding_period", 3.0))
                growth = float(c.get("revenue_growth", 0.12))

                # Project moic based on extrapolation
                remaining_years = max(1.0, 5.0 - hp)
                projected_moic = current_moic * (1 + growth * remaining_years * 0.5)
                noise = float(rng.normal(0, 0.3))
                projected_moic = max(0.5, min(6.0, projected_moic + noise))

                aug_company = dict(c)
                aug_company["exit_moic"] = projected_moic
                aug_company["status"] = "exited"
                augmented.append(aug_company)

        return augmented

    # ------------------------------------------------------------------
    # Predict
    # ------------------------------------------------------------------

    def predict(self, company: Dict[str, Any]) -> Dict[str, Any]:
        """Return MOIC prediction with P10/P50/P90 and mean."""
        if not self._fitted:
            raise RuntimeError("MOICModel must be fitted before prediction.")

        x = _extract_features(company).reshape(1, -1)
        x = np.nan_to_num(x, nan=0.0, posinf=10.0, neginf=0.0)

        predictions = {}
        for label, model in self._models.items():
            predictions[label] = float(model.predict(x)[0])

        # Ensure ordering: p10 <= p50 <= p90
        p10 = predictions.get("p10", 1.0)
        p50 = predictions.get("p50", 2.0)
        p90 = predictions.get("p90", 3.5)

        p10 = max(0.3, p10)
        p50 = max(p10 + 0.1, p50)
        p90 = max(p50 + 0.2, p90)
        mean_moic = (p10 + p50 * 2 + p90) / 4.0  # weighted towards median

        return {
            "p10": round(p10, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "mean": round(mean_moic, 2),
            "features_used": FEATURE_NAMES,
        }

    # ------------------------------------------------------------------
    # Feature importance
    # ------------------------------------------------------------------

    def get_feature_importance(self) -> List[Dict[str, Any]]:
        """Return feature importance from the P50 model."""
        if not self._fitted or self._feature_importances is None:
            return [{"feature": f, "importance": 1.0 / len(FEATURE_NAMES)} for f in FEATURE_NAMES]

        importances = self._feature_importances
        total = importances.sum()
        if total == 0:
            normalised = np.ones(len(FEATURE_NAMES)) / len(FEATURE_NAMES)
        else:
            normalised = importances / total

        result = []
        for name, imp in zip(FEATURE_NAMES, normalised):
            result.append({
                "feature": FEATURE_DISPLAY_NAMES.get(name, name),
                "importance": round(float(imp), 4),
            })

        # Sort by importance descending
        result.sort(key=lambda x: x["importance"], reverse=True)
        return result

    # ------------------------------------------------------------------
    # SHAP values (simplified implementation)
    # ------------------------------------------------------------------

    def get_shap_values(self, company: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Return simplified feature contributions using feature importances
        and the difference between company feature values and training mean.
        """
        if not self._fitted:
            return []

        x = _extract_features(company)
        x = np.nan_to_num(x, nan=0.0, posinf=10.0, neginf=0.0)

        # Training mean per feature
        if self._train_X is not None and len(self._train_X) > 0:
            train_mean = np.nanmean(self._train_X, axis=0)
            train_std = np.nanstd(self._train_X, axis=0)
        else:
            train_mean = np.zeros(len(FEATURE_NAMES))
            train_std = np.ones(len(FEATURE_NAMES))

        # Get P50 model prediction for company vs baseline
        x_reshaped = x.reshape(1, -1)
        baseline = train_mean.reshape(1, -1)

        pred_company = float(self._models["p50"].predict(x_reshaped)[0])
        pred_baseline = float(self._models["p50"].predict(baseline)[0])
        total_effect = pred_company - pred_baseline

        # Distribute total effect proportionally to feature importance * deviation
        importances = self._feature_importances if self._feature_importances is not None else np.ones(len(FEATURE_NAMES))
        deviations = np.abs(x - train_mean)
        std_safe = np.where(train_std > 0, train_std, 1.0)
        normalised_dev = deviations / std_safe
        weights = importances * normalised_dev
        weight_sum = weights.sum()

        shap_values = []
        for i, name in enumerate(FEATURE_NAMES):
            if weight_sum > 0:
                contribution = float(total_effect * weights[i] / weight_sum)
            else:
                contribution = total_effect / len(FEATURE_NAMES)

            shap_values.append({
                "feature": FEATURE_DISPLAY_NAMES.get(name, name),
                "value": round(float(x[i]), 4),
                "contribution": round(contribution, 4),
            })

        # Sort by absolute contribution
        shap_values.sort(key=lambda s: abs(s["contribution"]), reverse=True)
        return shap_values

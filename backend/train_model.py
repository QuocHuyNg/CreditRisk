"""
Credit Scoring Model Training Script
Trains HistGradientBoostingClassifier on cs-training.csv
and exports the model + metadata to model.pkl
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_PATH = os.path.join(BASE_DIR, "cs-training.csv")
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")

# ─── Feature columns (same order as notebook) ─────────────────────────────────
FEATURE_COLS = [
    "RevolvingUtilizationOfUnsecuredLines",
    "age",
    "NumberOfTime30-59DaysPastDueNotWorse",
    "DebtRatio",
    "MonthlyIncome",
    "NumberOfOpenCreditLinesAndLoans",
    "NumberOfTimes90DaysLate",
    "NumberRealEstateLoansOrLines",
    "NumberOfTime60-89DaysPastDueNotWorse",
    "NumberOfDependents",
]

TARGET_COL = "SeriousDlqin2yrs"


def prob_to_credit_score(pd_prob, base_score=600, pdo=50):
    """Convert probability of default to credit score (300-850 scale)."""
    factor = pdo / np.log(2)
    offset = base_score - factor * np.log(pd_prob / (1 - pd_prob + 1e-10))
    score = np.clip(offset, 300, 850)
    return np.round(score).astype(int)


def get_risk_tier(score):
    """Map credit score to risk tier."""
    if score >= 750:
        return {"tier": "Excellent", "color": "#22c55e", "rank": 1}
    elif score >= 700:
        return {"tier": "Good", "color": "#84cc16", "rank": 2}
    elif score >= 630:
        return {"tier": "Fair", "color": "#f59e0b", "rank": 3}
    elif score >= 550:
        return {"tier": "Poor", "color": "#f97316", "rank": 4}
    else:
        return {"tier": "Very Poor", "color": "#ef4444", "rank": 5}


def train_and_export():
    print("Loading training data...")
    df = pd.read_csv(TRAIN_PATH)

    # Drop unnamed index column if present
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    print(f"Dataset: {len(df):,} rows, default rate: {y.mean():.2%}")

    # Train/val split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training HistGradientBoostingClassifier...")
    model = HistGradientBoostingClassifier(
        max_iter=100,
        learning_rate=0.05,
        random_state=42,
    )
    model.fit(X_train, y_train)

    # Evaluate
    pd_val = model.predict_proba(X_val)[:, 1]
    auc = roc_auc_score(y_val, pd_val)
    gini = 2 * auc - 1
    print(f"ROC-AUC: {auc:.4f} | Gini: {gini:.4f}")

    # Compute feature stats for frontend hints
    feature_stats = {}
    for col in FEATURE_COLS:
        feature_stats[col] = {
            "mean": float(X[col].mean()),
            "median": float(X[col].median()),
            "min": float(X[col].quantile(0.01)),
            "max": float(X[col].quantile(0.99)),
        }

    # Save everything
    payload = {
        "model": model,
        "feature_cols": FEATURE_COLS,
        "feature_stats": feature_stats,
        "metrics": {"auc": auc, "gini": gini},
    }
    joblib.dump(payload, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    train_and_export()

import pandas as pd

MAX_INITIAL_BOOST = 20
ERROR_THRESHOLD = 5

ROLE_DEFAULTS = {
    "driver": {"streak_days": 5},
    "merchant": {"streak_days": 5},
    "delivery_partner": {"streak_days": 5}
}

# ---------------- Example Dataset ---------------- #
data = {
    "UserID": [1, 2, 3, 4],
    "SocialEngagement": [70, 20, 50, 10],
    "FinancialEngagement": [80, 40, 60, 30],
    "GigWorkerEngagement": [50, 10, 0, 70],
    "JobEngagement": [90, 60, 40, 20]
}
df = pd.DataFrame(data)

# ---------------- Functions ---------------- #
def normalize_preferences(preference_factors):
    total = sum(preference_factors.values())
    return {k: v / total for k, v in preference_factors.items()}

def calculate_initial_boosts(df, preference_factors):
    weights = normalize_preferences(preference_factors)
    def compute_boost(row):
        score = 0
        for factor, weight in weights.items():
            score += row[factor] * weight
        return round((score / 100) * MAX_INITIAL_BOOST, 2)

    df["InitialBoost"] = df.apply(compute_boost, axis=1)

    mean_boost = df["InitialBoost"].mean()
    df["ErrorFactor"] = df["InitialBoost"].apply(lambda x: round(abs(x - mean_boost), 2))

    if df["ErrorFactor"].max() > ERROR_THRESHOLD:
        min_boost, max_boost = df["InitialBoost"].min(), df["InitialBoost"].max()
        df["InitialBoost"] = df["InitialBoost"].apply(
            lambda x: round(((x - min_boost) / (max_boost - min_boost)) * MAX_INITIAL_BOOST, 2)
        )
        mean_boost = df["InitialBoost"].mean()
        df["ErrorFactor"] = df["InitialBoost"].apply(lambda x: round(abs(x - mean_boost), 2))

    return df[["UserID", "InitialBoost", "ErrorFactor"]]

# ---------------- Example Run ---------------- #
company_preferences = {
    "SocialEngagement": 0.2,
    "FinancialEngagement": 1.0,
    "GigWorkerEngagement": 0.5,
    "JobEngagement": 0.7
}

boost_results = calculate_initial_boosts(df, company_preferences)
def get_boost_for_user(user_id):
    row = boost_results[boost_results["UserID"].astype(str) == str(user_id)]
    if not row.empty:
        return row.iloc[0]["InitialBoost"]
    return 0


__all__ = ["boost_results", "get_boost_for_user"]
from ml_model_module import predict_with_error
from utils import (   
    percentile_rank, get_tier, apply_fairness,
    compute_days, detailed_activity_analysis,
    ROLE_FEATURE_WEIGHTS, ROLE_BOOSTS
)
from initial_boosts import get_boost_for_user
from hybridspamdetector import HybridSpamDetector
import pandas as pd
import numpy as np
# Single instance of spam detector
spam_detector = HybridSpamDetector()

def compute_level_score_backend(user_profile, population_samples, month_active, history_scores=[]):
    print('user_profile',user_profile)
    role = user_profile.get("role", "driver")
    features = user_profile.get("features", {})

    # ---------------- Role-specific features ----------------
    if role == "driver":
        features_list = [
            features.get("login_rate", 0),
            features.get("streak_days", 0),
            features.get("rides_30d", 0),
            features.get("on_time_rate", 0),
            features.get("cancellation_rate", 0),
            features.get("rating", 0),
            features.get("avg_ride_distance", 0),
            features.get("peak_hour_rides", 0),
            features.get("late_pickup_rate", 0),
            features.get("customer_complaints", 0),
            features.get("ratings_std", 0),
            features.get("total_hours_worked", 0)
        ]
    elif role == "merchant":
        features_list = [
            features.get("login_rate", 0),
            features.get("streak_days", 0),
            features.get("sales_30d", 0),
            features.get("order_fulfillment_rate", 0),
            features.get("return_rate", 0),
            features.get("rating", 0),
            features.get("avg_order_value", 0),
            features.get("peak_hour_sales", 0),
            features.get("complaints_received", 0),
            features.get("new_customers_acquired", 0),
            features.get("repeat_customer_rate", 0),
            features.get("total_hours_operated", 0)
        ]
    elif role == "delivery":
        features_list = [
            features.get("login_rate", 0),
            features.get("streak_days", 0),
            features.get("deliveries_30d", 0),
            features.get("on_time_delivery_rate", 0),
            features.get("cancellation_rate", 0),
            features.get("rating", 0),
            features.get("avg_delivery_distance", 0),
            features.get("peak_hour_deliveries", 0),
            features.get("late_delivery_rate", 0),
            features.get("customer_complaints", 0),
            features.get("ratings_std", 0),
            features.get("total_hours_worked", 0)
        ]
    else:
        features_list = [features.get(k, 0) for k in features]

    # ---------------- Weighted features ----------------
    weights = ROLE_FEATURE_WEIGHTS.get(role, [1]*len(features_list))
    weighted_features = [float(f)*float(w) for f, w in zip(features_list, weights)]
    weighted_features = np.array(weighted_features,dtype=float).reshape(1,-1)
    # ---------------- ML prediction ----------------
    R_raw, pred_error = predict_with_error(weighted_features)
    print('here it is we ave got the result',R_raw,pred_error)
    R_raw /= 1000
    percentile = percentile_rank(R_raw, population_samples.get("R_raw_values", []))
    print('here got the percentile',percentile)
    base_gain = 1000 * percentile * 0.15
    gain = min(base_gain * (0.5 + 0.05 * month_active), 80)

    prev_score = history_scores[-1] if history_scores else 0
    trend_penalty = 0
    if len(history_scores) > 1 and (prev_score - history_scores[-2]) < -20:
        trend_penalty = 10
    initial_score = prev_score + gain - trend_penalty
 
    # ---------------- Activity analysis ----------------
    tier = get_tier(initial_score, role)
    print('here got the tier',tier)
    activity_log = user_profile.get("activity_log", [])
    inconsistent_days, inactivity_days = compute_days(activity_log)
    print('here got the inconsistent_days',inconsistent_days)
    print('here got the inactivity_days',inactivity_days)
    avg_streak, max_streak = detailed_activity_analysis(activity_log)
    print('here got the avg_streak',avg_streak)
    print('here got the max_streak',max_streak)
    score_after, penalty, consistency_bonus = apply_fairness(initial_score, tier, inactivity_days, inconsistent_days)
    print('here got the score_after',score_after)
    print('here got the penalty',penalty)
    print('here got the consistency_bonus',consistency_bonus)

    # ---------------- Initial Boost ----------------
    boost = get_boost_for_user(user_profile.get("user_id", 0))
    print('here got the boost',boost)
    if month_active == 1 and user_profile.get("first_time_account", True):
        boost += ROLE_BOOSTS[role]["first_time"]
    if role == "driver" and features.get("rides_30d", 0) > 100:
        boost += ROLE_BOOSTS[role]["milestone_rides"]
    elif role == "merchant" and features.get("sales_30d", 0) > 100:
        boost += ROLE_BOOSTS[role]["high_sales"]
    elif role == "delivery_partner" and features.get("deliveries_30d", 0) > 100:
        boost += ROLE_BOOSTS[role]["milestone_deliveries"]
    print('here got the boost',boost)

    # ---------------- Spam Detection ----------------
    # Ensure all required columns exist
    spam_defaults = {
        "review_count": 0,
        "rating_variance": 0,
        "avg_review_length": 0,
        "logins_per_day": 0,
        "std_login_time": 0,
        "account_age_days": 0
    }
    for k, v in spam_defaults.items():
        features.setdefault(k, v)
    print('abover spam',features)
    spam_score = spam_detector.predict_hybrid_score(features)
    print('spam score',spam_score)

    # ---------------- Final Score ----------------
    final_score = min(1000, score_after + boost)
    print('here got the final_score',final_score)
    reason_log = (
        f"+{round(gain,2)} gain, -{penalty} penalty, +{consistency_bonus} consistency, "
        f"+{boost} boost, ±{pred_error} model error"
    )
# final score is the level score
    return {
        "final_score": round(final_score, 2),
        "tier": get_tier(final_score, role),
        "penalty": penalty,
        "consistency_bonus": consistency_bonus,
        "boost": boost,
        "inconsistent_days": inconsistent_days,
        "inactivity_days": inactivity_days,
        "avg_inactive_streak": avg_streak,
        "max_inactive_streak": max_streak,
        "ml_prediction_error_margin": pred_error,
        "spam_score": spam_score,
        "reason_log": reason_log
    }

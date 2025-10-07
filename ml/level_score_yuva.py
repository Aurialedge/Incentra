# level_score.py
from ml_model_module import predict_with_error
from utils import (
    percentile_rank, get_tier, apply_fairness,
    compute_days, detailed_activity_analysis,
    ROLE_FEATURE_WEIGHTS, ROLE_BOOSTS
)
from initial_boosts import get_boost_for_user
from spam_detection import HybridSpamDetector, apply_spam_penalty

def compute_level_score_backend(user_profile, population_samples, month_active, history_scores=[]):
    role = user_profile.get("role", "driver")
    features = user_profile["features"]

    # ---------------- Role-specific feature vectors ---------------- #
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
    elif role == "delivery_partner":
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

    # ---------------- Weighted features ---------------- #
    weights = ROLE_FEATURE_WEIGHTS.get(role, [1]*len(features_list))
    weighted_features = [f*w for f, w in zip(features_list, weights)]

    # ---------------- ML prediction ---------------- #
    R_raw, pred_error = predict_with_error(weighted_features)
    R_raw /= 1000
    percentile = percentile_rank(R_raw, population_samples.get("R_raw_values", []))

    base_gain = 1000 * percentile * 0.15
    gain = min(base_gain * (0.5 + 0.05 * month_active), 80)

    prev_score = history_scores[-1] if history_scores else 0
    trend_penalty = 0
    if len(history_scores) > 1 and (prev_score - history_scores[-2]) < -20:
        trend_penalty = 10

    initial_score = prev_score + gain - trend_penalty

    # ---------------- Activity analysis ---------------- #
    tier = get_tier(initial_score, role)
    activity_log = user_profile.get("activity_log", [])
    inconsistent_days, inactivity_days = compute_days(activity_log)
    avg_streak, max_streak = detailed_activity_analysis(activity_log)

    score_after, penalty, consistency_bonus = apply_fairness(
        initial_score, tier, inactivity_days, inconsistent_days
    )

    # ---------------- LINK Initial Boost from Pandas ---------------- #
    boost = get_boost_for_user(user_profile.get("user_id", 0))

    # Add role-specific boosts
    if month_active == 1 and user_profile.get("first_time_account", True):
        boost += ROLE_BOOSTS[role]["first_time"]

    if role == "driver" and features.get("rides_30d", 0) > 100:
        boost += ROLE_BOOSTS[role]["milestone_rides"]
    elif role == "merchant" and features.get("sales_30d", 0) > 100:
        boost += ROLE_BOOSTS[role]["high_sales"]
    elif role == "delivery_partner" and features.get("deliveries_30d", 0) > 100:
        boost += ROLE_BOOSTS[role]["milestone_deliveries"]

    # ---------------- Hybrid Spam/Anomaly Detection ---------------- #
    detector = HybridSpamDetector()
    spam_score = detector.predict_hybrid_score(user_profile)
    SPAM_THRESHOLD = 0.7
    is_spam = spam_score > SPAM_THRESHOLD
    # threshold
    if is_spam:
        score_after, applied_penalty = apply_spam_penalty(score_after, score_after, spam_score)
        reason_log_spam = f", ⚠️ flagged spam (penalty {applied_penalty})"
    else:
        reason_log_spam = ""

    # ---------------- Final Score ---------------- #
    final_score = min(1000, score_after + boost)
    reason_log = (
        f"+{round(gain,2)} gain, -{penalty} penalty, +{consistency_bonus} consistency, "
        f"+{boost} boost, ±{pred_error} model error{reason_log_spam}"
    )

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

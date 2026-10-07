import numpy as np
import logging
from level_score import compute_level_score_backend


# ---------------- Logging Setup ---------------- #
# Sets up logging to capture warnings and errors, saving them to a file
# and also printing them to the console for immediate visibility.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("credit_score_warnings.log"),  # logs to file
        logging.StreamHandler()  # logs to console
    ]
)

# ---------------- Model Configuration ---------------- #
 
# Role-based weights define the importance of different features for each user role.
# This allows the model to be tailored to the specific activities of drivers, merchants, etc.
# on_time_ratio=1-late_pickup_rate
# avg_rating=rating 
# rides_completed=rides_30d
# complaints=customer_complaints

# deliveries_complted=deleives_30d 
# on_time_ratio=on_time_delivery_rate
# customer_rating=rating 
# issues=customer_complaints

import os
import json

ROLE_WEIGHTS = {
    "driver": {
        "features": ["rides_completed", "avg_rating", "on_time_ratio", "complaints"],
        "weights": [0.85, 0.25, 0.20, -0.15]
    },
    "merchant": {
        "features": ["transactions", "disputes", "fulfillment_rate", "revenue_growth"],
        "weights": [0.35, -0.15, 0.30, 0.25]
    },
    "delivery": {
        "features": ["deliveries_completed", "on_time_ratio", "customer_rating", "issues"],
        "weights": [0.80, 0.20, 0.25, -0.15]
    }
}

TIER_MULTIPLIERS = {"Gold": 1.75, "Ruby": 1.50, "Amber": 1.25, "Bronze": 1.00}
EXTRA_WEIGHTS = {"behavior_score": 0.2, "loyalty_score": 0.2, "demand_score": 0.2}

# Load data-driven empirical weights if exported
_weights_file = os.path.join(os.path.dirname(__file__), "updated_weights.json")
if os.path.exists(_weights_file):
    try:
        with open(_weights_file, "r") as _f:
            _loaded = json.load(_f)
            if "ROLE_WEIGHTS" in _loaded:
                ROLE_WEIGHTS = _loaded["ROLE_WEIGHTS"]
            if "TIER_MULTIPLIERS" in _loaded:
                TIER_MULTIPLIERS = _loaded["TIER_MULTIPLIERS"]
            if "EXTRA_WEIGHTS" in _loaded:
                EXTRA_WEIGHTS = _loaded["EXTRA_WEIGHTS"]
            logging.info("Loaded data-driven weights from updated_weights.json")
    except Exception as _e:
        logging.warning(f"Could not load updated_weights.json: {_e}")

# ---------------- Utility Functions ---------------- #

def percentile_rank(value, population):
    """Calculate percentile rank of a value within its population."""
    if not population:
        return 0
    less = sum(1 for x in population if x < value)
    equal = sum(1 for x in population if x == value)
    return (less + 0.5 * equal) / len(population)

def normalize_feature(value, feature_name):
    """
    Normalize feature values to a common scale (0-1) with type-checking and validation.
    This ensures that features with different scales (e.g., ratings 1-5, rides 0-1000)
    are comparable.
    """
    try:
        if not isinstance(value, (int, float)):
            logging.warning(f"Feature '{feature_name}' has invalid type '{type(value).__name__}', using default 0")
            value = 0

        # Note: In a production system, these normalization ceilings (e.g., 100.0) would
        # be determined from data analysis (e.g., 95th percentile) rather than being fixed.
        if feature_name in ["rides_completed", "transactions", "deliveries_completed", "assignments_submitted"]:
            return min(max(0, float(value)) / 100.0, 1.0)
        elif feature_name in ["avg_rating", "customer_rating", "peer_feedback"]:
            return max(0, min(5, float(value))) / 5.0
        elif feature_name in ["on_time_ratio", "fulfillment_rate", "attendance"]:
            return max(0.0, min(1.0, float(value)))
        elif feature_name in ["complaints", "disputes", "issues"]:
            # Higher complaints lead to a lower score (inverted logic)
            return 1.0 - min(max(0, float(value)) / 10.0, 1.0)
        elif feature_name in ["revenue_growth", "grades"]:
            return min(max(0.0, float(value)) / 100.0, 1.0)
        else:
            return 0.5
    except Exception as e:
        logging.warning(f"Failed to normalize feature '{feature_name}' with value '{value}': {e}")
        return 0.5

# ---------------- Core Score Calculation Logic ---------------- #

def compute_role_score(user_profile):
    """Compute the role-specific score based on predefined features and weights."""
    try:
        role = user_profile.get("role")
        if role not in ROLE_WEIGHTS:
            raise ValueError(f"Invalid role '{role}'")

        features = ROLE_WEIGHTS[role]["features"]
        weights = ROLE_WEIGHTS[role]["weights"]

        numerator = sum(normalize_feature(user_profile.get(f, 0), f) * w for f, w in zip(features, weights))
        denominator = sum(abs(w) for w in weights)
        
        role_score = numerator / denominator if denominator != 0 else 0.5
        return role_score * 100
    except Exception as e:
        logging.error(f"Error in compute_role_score for user {user_profile.get('id', 'N/A')}: {e}")
        return 50

def compute_global_score(user_profile, population_samples):
    """Compute the global percentile score by comparing a user against their peers."""
    try:
        raw_score = compute_role_score(user_profile)
        if not population_samples or not isinstance(population_samples, list):
            return max(40, min(100, raw_score))
        
        role = user_profile.get("role")
        population_scores = [compute_role_score(p) for p in population_samples if p.get("role") == role]
        if not population_scores:
            return max(40, min(100, raw_score))
        
        rank = percentile_rank(raw_score, population_scores)
        # Scale rank to a score between 40 and 100
        return 40 + 60 * rank
    except Exception as e:
        logging.error(f"Error in compute_global_score for user {user_profile.get('id', 'N/A')}: {e}")
        return 60.0

def fairness_adjustment(global_score, accept_rate=0.6, target_accept=0.7, eta=0.1):
    """
    Apply a post-processing fairness adjustment to correct for group-level disparities
    in acceptance rates. This helps ensure equitable outcomes.
    """
    try:
        adj = -eta * (accept_rate - target_accept)
        adjusted_score = np.clip(global_score + adj, 0, 100)
        return adjusted_score, adj
    except Exception as e:
        logging.error(f"Error in fairness_adjustment: {e}")
        return global_score, 0

def compute_final_credit_score(user_profile, population_samples,
                               delta_base=2.0, lambda_r=0.7,
                               accept_rate=0.6, target_accept=0.7, eta=0.1):
    """
    Compute the final credit score by combining the role-specific performance,
    global peer ranking, fairness adjustments, and loyalty tier bonuses.
    """
    try:
        role = user_profile.get("role")
        if role not in ROLE_WEIGHTS:
            raise ValueError(f"Invalid role '{role}'")

        tier = user_profile.get("tier", "Bronze")
        if tier not in TIER_MULTIPLIERS:
            raise ValueError(f"Invalid tier '{tier}'")

        # Ensure features dictionary exists for level score computation
        if "features" not in user_profile or not user_profile["features"]:
            user_profile["features"] = {
                "rides_30d": user_profile.get("rides_completed", 0),
                "rating": user_profile.get("avg_rating", 0) or user_profile.get("customer_rating", 0) or 4.0,
                "on_time_rate": user_profile.get("on_time_ratio", 0.9),
                "customer_complaints": user_profile.get("complaints", 0) or user_profile.get("issues", 0),
                "deliveries_30d": user_profile.get("deliveries_completed", 0),
                "on_time_delivery_rate": user_profile.get("on_time_ratio", 0.9),
                "sales_30d": user_profile.get("transactions", 0),
                "complaints_received": user_profile.get("disputes", 0),
                "order_fulfillment_rate": user_profile.get("fulfillment_rate", 0.9),
                "streak_days": int(user_profile.get("loyalty_score", 0.5) * 60)
            }

        # --- 1. Role Component (Individual Performance) ---
        level_result = compute_level_score_backend(
            user_profile,
            population_samples={"R_raw_values": []},
            month_active=user_profile.get("month_active", 1),
            history_scores=user_profile.get("history_scores", [])
        )

        role_score = level_result["final_score"]

        # Add extra behavioral factors
        B = user_profile.get("behavior_score", 0.5)
        L = user_profile.get("loyalty_score", 0.5)  
        D = user_profile.get("demand_score", 0.5)

        # Validate extra factors are between 0 and 1
        for factor_name, factor_value in [("behavior_score", B), ("loyalty_score", L), ("demand_score", D)]:
            if not isinstance(factor_value, (int, float)) or not (0 <= factor_value <= 1):
                logging.warning(f"Extra factor '{factor_name}' invalid value '{factor_value}', defaulting to 0.5")
                if factor_name == "behavior_score": B = 0.5
                elif factor_name == "loyalty_score": L = 0.5
                elif factor_name == "demand_score": D = 0.5

        numerator = role_score + EXTRA_WEIGHTS["behavior_score"] * B * 100 + EXTRA_WEIGHTS["loyalty_score"] * L * 100 + EXTRA_WEIGHTS["demand_score"] * D * 100
        denominator = (sum(abs(w) for w in ROLE_WEIGHTS[role]["weights"])+ sum(v * 100 for v in EXTRA_WEIGHTS.values()))
        role_component = numerator / denominator if denominator != 0 else 50

        # --- 2. Global Component (Peer Performance) ---
        global_score = compute_global_score(user_profile, population_samples)

        # --- 3. Fairness Adjustment ---
        fairness_score, adj_r = fairness_adjustment(global_score, accept_rate, target_accept, eta)

        # --- 4. Combine Scores ---
        # lambda_r balances the weight between individual performance and peer-ranked performance
        combined_score = lambda_r * role_component + (1 - lambda_r) * fairness_score

        # --- 5. Delta Adjustment (Loyalty Bonus) ---
        delta_multiplier = TIER_MULTIPLIERS.get(tier, 1.0)
        delta_adj = delta_base * delta_multiplier

        # --- 6. Final Score ---
        final_score = np.clip(combined_score + delta_adj, 0, 100)

        return {
            # "role": role,
            "tier": tier,
            "role_component": round(role_component, 2),
            "global_score": round(global_score, 2),
            "fairness_adj": round(adj_r, 2),
            "combined_score": round(combined_score, 2),
            "delta_adj": round(delta_adj, 2),
            "final_score": round(final_score, 2)*10
        }

    except Exception as e:
        logging.error(f"Critical error in compute_final_credit_score for user {user_profile.get('id', 'N/A')}: {e}")
        return {"final_score": 0, "error": str(e)}

# ---------------- Example Usage ---------------- #
if __name__ == "__main__":
    # Example user profile
    user = {
        "id": "user123",
        "role": "driver",
        "rides_completed": 120,
        "avg_rating": 4.8,
        "on_time_ratio": 0.9,
        "complaints": 3,
        "behavior_score": 0.7, 
        "loyalty_score": 0.6, 
        "demand_score": 0.8,
        "tier": "Ruby"
    }
    
    # Example population for peer comparison
    population = [
        {"role": "driver", "rides_completed": 80, "avg_rating": 4.5, "on_time_ratio": 0.85, "complaints": 5},
        {"role": "driver", "rides_completed": 200, "avg_rating": 4.9, "on_time_ratio": 0.95, "complaints": 1},
        {"role": "driver", "rides_completed": 110, "avg_rating": 4.7, "on_time_ratio": 0.92, "complaints": 2},
    ]

    result = compute_final_credit_score(user, population)
    print("\n--- Credit Score Calculation Result ---")
    import json
    print(json.dumps(result, indent=2))
    print("-------------------------------------\n")

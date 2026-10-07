import math
import numpy as np

ROLE_TIERS = {
    "driver": [250, 500, 750],
    "merchant": [200, 450, 700],
    "delivery": [220, 480, 740],
    "delivery_partner": [220, 480, 740]
}

import os
import json

ROLE_FEATURE_WEIGHTS = {
    "driver": [1.0, 0.85, 1.0, 0.95, 0.90, 0.95, 0.75, 0.70, 0.85, 0.90, 0.75, 0.65],
    "merchant": [1.0, 0.85, 1.0, 0.95, 0.85, 0.95, 0.80, 0.70, 0.90, 0.85, 0.80, 0.65],
    "delivery": [1.0, 0.85, 1.0, 0.95, 0.85, 0.95, 0.75, 0.70, 0.85, 0.90, 0.75, 0.65],
    "delivery_partner": [1.0, 0.85, 1.0, 0.95, 0.85, 0.95, 0.75, 0.70, 0.85, 0.90, 0.75, 0.65]
}

# Dynamically load calibrated weights if available
_weights_file = os.path.join(os.path.dirname(__file__), "updated_weights.json")
if os.path.exists(_weights_file):
    try:
        with open(_weights_file, "r") as _f:
            _loaded = json.load(_f)
            if "ROLE_FEATURE_WEIGHTS" in _loaded:
                ROLE_FEATURE_WEIGHTS = _loaded["ROLE_FEATURE_WEIGHTS"]
    except Exception:
        pass

ROLE_BOOSTS = {
    "driver": {"first_time": 40, "milestone_rides": 10},
    "merchant": {"first_time": 30, "high_sales": 10},
    "delivery": {"first_time": 40, "milestone_deliveries": 10},
    "delivery_partner": {"first_time": 40, "milestone_deliveries": 10}
}

def percentile_rank(value, population):
    if not population: return 0
    less = sum(1 for x in population if x < value)
    equal = sum(1 for x in population if x == value)
    return (less + 0.5*equal)/len(population)

def get_tier(score, role="driver"):
    thresholds = ROLE_TIERS.get(role,[250,500,750])
    if score <= thresholds[0]: return "Bronze"
    elif score <= thresholds[1]: return "Amber"
    elif score <= thresholds[2]: return "Ruby"
    else: return "Gold"

def apply_fairness(score, tier, inactivity_days, inconsistent_days):
    penalty = int(100*(1-math.exp(-inactivity_days/30))) if inactivity_days else 0
    if inconsistent_days: penalty += 30
    tier_factor = {"Bronze":0.5,"Amber":0.75,"Ruby":1.0,"Gold":1.0}
    penalty = int(penalty * tier_factor[tier])
    streak_bonus = 20 if inactivity_days==0 and inconsistent_days==0 else 0
    score_after = max(0, score-penalty)
    score_after = min(1000, score_after+streak_bonus)
    return score_after, penalty, streak_bonus

def compute_days(activity_log,max_inactivity_gap=7):
    inconsistent_days = sum(1 for day in activity_log if not day["active"])
    inactivity_days = 0
    print('data isss ',activity_log)
    for day in activity_log:
        is_active=day.get("active",False) 
        if not is_active:
            inactivity_days+=1
    return inconsistent_days,inactivity_days

def detailed_activity_analysis(activity_log):
    inactive_streaks=[]
    streak=0
    for day in activity_log:
        if not day["active"]: streak+=1
        else:
            if streak>0: inactive_streaks.append(streak)
            streak=0
    if streak>0: inactive_streaks.append(streak)
    avg_streak = np.mean(inactive_streaks) if inactive_streaks else 0
    max_streak = max(inactive_streaks) if inactive_streaks else 0
    return avg_streak, max_streak
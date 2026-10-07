import sys
sys.path.append('s:/Projects/Incentra/ml')
from level_score import compute_level_score_backend

profiles = [
    {
        'label': 'Bronze Candidate',
        'role': 'driver',
        'history_scores': [120, 140, 150],
        'features': {'rides_30d': 18, 'rating': 3.8, 'on_time_rate': 0.72, 'cancellation_rate': 0.18, 'customer_complaints': 5},
        'activity_log': [{'active': False}] * 15 + [{'active': True}] * 15
    },
    {
        'label': 'Amber Candidate',
        'role': 'driver',
        'history_scores': [340, 360, 380],
        'features': {'rides_30d': 65, 'rating': 4.3, 'on_time_rate': 0.88, 'cancellation_rate': 0.08, 'customer_complaints': 2},
        'activity_log': [{'active': False}] * 5 + [{'active': True}] * 25
    },
    {
        'label': 'Ruby Candidate',
        'role': 'driver',
        'history_scores': [580, 600, 620],
        'features': {'rides_30d': 110, 'rating': 4.6, 'on_time_rate': 0.93, 'cancellation_rate': 0.04, 'customer_complaints': 1},
        'activity_log': [{'active': True}] * 30
    },
    {
        'label': 'Gold Candidate',
        'role': 'driver',
        'history_scores': [750, 770, 790],
        'features': {'rides_30d': 160, 'rating': 4.9, 'on_time_rate': 0.98, 'cancellation_rate': 0.02, 'customer_complaints': 0},
        'activity_log': [{'active': True}] * 30
    }
]

for p in profiles:
    res = compute_level_score_backend(p, {'R_raw_values': []}, month_active=3, history_scores=p['history_scores'])
    print(f"{p['label']}: History {p['history_scores'][-1]} -> Score: {res['final_score']} | Tier: {res['tier']}")

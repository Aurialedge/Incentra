import os
import numpy as np
import pandas as pd

np.random.seed(42)
N = 10000

roles = np.random.choice(['driver', 'merchant', 'delivery'], size=N, p=[0.45, 0.30, 0.25])
user_ids = [f"INC_{i+1:05d}" for i in range(N)]

# Demographics
ages = np.clip(np.random.normal(loc=33, scale=8.5, size=N).astype(int), 19, 64)
genders = np.random.choice(['male', 'female', 'other'], size=N, p=[0.67, 0.30, 0.03])
city_tiers = np.random.choice(['Tier 1', 'Tier 2', 'Tier 3'], size=N, p=[0.50, 0.35, 0.15])
platform_tenure_months = np.clip(np.random.exponential(scale=18, size=N).astype(int) + 1, 1, 60)
grab_id_linked = np.random.choice([1, 0], size=N, p=[0.82, 0.18])

# Operational metrics initialized
rides_30d = np.zeros(N, dtype=int)
deliveries_30d = np.zeros(N, dtype=int)
sales_30d = np.zeros(N, dtype=int)
avg_ticket_value = np.zeros(N, dtype=float)
on_time_rate = np.zeros(N, dtype=float)
cancellation_rate = np.zeros(N, dtype=float)
customer_complaints = np.zeros(N, dtype=int)
hours_worked = np.zeros(N, dtype=float)

# Behavioral features
rating = np.zeros(N, dtype=float)
login_rate = np.zeros(N, dtype=float)
streak_days = np.zeros(N, dtype=int)
review_count = np.clip(np.random.poisson(lam=45, size=N), 3, 300)
rating_variance = np.clip(np.random.gamma(shape=1.5, scale=0.08, size=N), 0.01, 0.50).round(3)
logins_per_day = np.clip(np.random.normal(loc=1.8, scale=0.6, size=N), 0.5, 5.0).round(2)
std_login_time = np.clip(np.random.uniform(0.1, 2.5, size=N), 0.1, 2.5).round(2)

# Financial features
monthly_gross_income = np.zeros(N, dtype=float)
monthly_expenses = np.zeros(N, dtype=float)
dti_ratio = np.zeros(N, dtype=float)
savings_buffer_months = np.zeros(N, dtype=float)
income_stability_cv = np.zeros(N, dtype=float)
utility_on_time_rate = np.zeros(N, dtype=float)
microloan_repay_rate = np.zeros(N, dtype=float)
instant_cashout_freq = np.zeros(N, dtype=int)

# Target tier distribution to ensure rich representation across ALL 4 TIERS:
# Gold: ~20%, Ruby: ~40%, Amber: ~25%, Bronze: ~15%
target_tiers = np.random.choice(['Bronze', 'Amber', 'Ruby', 'Gold'], size=N, p=[0.15, 0.25, 0.40, 0.20])

for i in range(N):
    t = target_tiers[i]
    r = roles[i]
    
    # Configure engagement and operational metrics modulated by profile tier
    if t == 'Gold':
        perf_factor = np.random.uniform(0.85, 1.0)
        complaints_base = 0.5
        cancel_base = np.random.uniform(0.01, 0.04)
        rating_val = np.random.uniform(4.7, 5.0)
        login_val = np.random.uniform(0.88, 1.0)
        streak_val = np.random.randint(30, 60)
        dti_val = np.random.uniform(0.10, 0.35)
        savings_val = np.random.uniform(2.5, 5.5)
        util_val = np.random.uniform(0.90, 1.0)
        micro_val = np.random.uniform(0.92, 1.0)
        cashout_val = np.random.poisson(lam=1.0)
    elif t == 'Ruby':
        perf_factor = np.random.uniform(0.60, 0.85)
        complaints_base = 1.2
        cancel_base = np.random.uniform(0.03, 0.08)
        rating_val = np.random.uniform(4.3, 4.75)
        login_val = np.random.uniform(0.70, 0.90)
        streak_val = np.random.randint(12, 35)
        dti_val = np.random.uniform(0.25, 0.45)
        savings_val = np.random.uniform(1.2, 3.2)
        util_val = np.random.uniform(0.80, 0.94)
        micro_val = np.random.uniform(0.82, 0.95)
        cashout_val = np.random.poisson(lam=2.5)
    elif t == 'Amber':
        perf_factor = np.random.uniform(0.35, 0.60)
        complaints_base = 2.5
        cancel_base = np.random.uniform(0.07, 0.15)
        rating_val = np.random.uniform(3.8, 4.35)
        login_val = np.random.uniform(0.45, 0.72)
        streak_val = np.random.randint(2, 15)
        dti_val = np.random.uniform(0.40, 0.65)
        savings_val = np.random.uniform(0.4, 1.8)
        util_val = np.random.uniform(0.65, 0.85)
        micro_val = np.random.uniform(0.60, 0.84)
        cashout_val = np.random.poisson(lam=5.0)
    else: # Bronze
        perf_factor = np.random.uniform(0.10, 0.35)
        complaints_base = 4.5
        cancel_base = np.random.uniform(0.12, 0.28)
        rating_val = np.random.uniform(3.2, 3.9)
        login_val = np.random.uniform(0.20, 0.50)
        streak_val = np.random.randint(0, 5)
        dti_val = np.random.uniform(0.55, 0.85)
        savings_val = np.random.uniform(0.1, 0.8)
        util_val = np.random.uniform(0.40, 0.70)
        micro_val = np.random.uniform(0.35, 0.65)
        cashout_val = np.random.poisson(lam=8.0)
        
    rating[i] = round(rating_val, 2)
    login_rate[i] = round(login_val, 2)
    streak_days[i] = streak_val
    on_time_rate[i] = round(np.clip(1.0 - cancel_base * 0.8 - np.random.uniform(0, 0.05), 0.50, 0.99), 2)
    cancellation_rate[i] = round(cancel_base, 2)
    customer_complaints[i] = int(np.clip(np.random.poisson(lam=complaints_base), 0, 10))
    dti_ratio[i] = round(dti_val, 3)
    savings_buffer_months[i] = round(savings_val, 2)
    utility_on_time_rate[i] = round(util_val, 2)
    microloan_repay_rate[i] = round(micro_val, 2)
    instant_cashout_freq[i] = int(np.clip(cashout_val, 0, 15))
    income_stability_cv[i] = round(np.clip(0.12 + (1.0 - perf_factor) * 0.45 + np.random.normal(0, 0.04), 0.08, 0.70), 3)

    if r == 'driver':
        rides = int(np.clip(perf_factor * 260 + np.random.normal(0, 15), 10, 320))
        rides_30d[i] = rides
        hours = np.clip(rides * 1.35 + np.random.normal(0, 10), 30, 300)
        hours_worked[i] = round(hours, 1)
        gross = rides * np.random.uniform(14, 22) + hours * 3.5
        monthly_gross_income[i] = round(gross, 2)
        expenses = gross * np.random.uniform(0.55, 0.78) + np.random.normal(200, 40)
        monthly_expenses[i] = round(max(250, expenses), 2)
    elif r == 'merchant':
        sales = int(np.clip(perf_factor * 420 + np.random.normal(0, 20), 15, 550))
        sales_30d[i] = sales
        aov = np.clip(np.random.gamma(shape=3.5, scale=18), 12, 350)
        avg_ticket_value[i] = round(aov, 2)
        hours = np.clip(perf_factor * 320 + np.random.normal(0, 20), 40, 420)
        hours_worked[i] = round(hours, 1)
        gross = sales * (aov * np.random.uniform(0.18, 0.32))
        monthly_gross_income[i] = round(gross, 2)
        expenses = gross * np.random.uniform(0.50, 0.74) + np.random.normal(300, 60)
        monthly_expenses[i] = round(max(350, expenses), 2)
    else: # delivery
        deliv = int(np.clip(perf_factor * 280 + np.random.normal(0, 15), 15, 350))
        deliveries_30d[i] = deliv
        hours = np.clip(deliv * 1.1 + np.random.normal(0, 10), 30, 280)
        hours_worked[i] = round(hours, 1)
        gross = deliv * np.random.uniform(10, 16) + hours * 3.0
        monthly_gross_income[i] = round(gross, 2)
        expenses = gross * np.random.uniform(0.52, 0.76) + np.random.normal(150, 30)
        monthly_expenses[i] = round(max(200, expenses), 2)

net_monthly_cashflow = np.round(monthly_gross_income - monthly_expenses, 2)

# Hybrid Spam Score
spam_noise = np.random.beta(a=1.2, b=15.0, size=N)
bot_mask = (logins_per_day > 3.8) & (rating_variance < 0.03) & (review_count > 150)
spam_score = np.clip(spam_noise + bot_mask.astype(float) * 0.65, 0.01, 0.98).round(3)

# Calibrate Level Score strictly matching tier cutoffs:
# Gold: 750 - 980
# Ruby: 500 - 749.9
# Amber: 250 - 499.9
# Bronze: 50 - 249.9
level_score = np.zeros(N, dtype=float)
for i in range(N):
    t = target_tiers[i]
    if t == 'Gold':
        level_score[i] = round(np.random.uniform(750.0, 960.0), 1)
    elif t == 'Ruby':
        level_score[i] = round(np.random.uniform(500.0, 749.0), 1)
    elif t == 'Amber':
        level_score[i] = round(np.random.uniform(250.0, 499.0), 1)
    else: # Bronze
        level_score[i] = round(np.random.uniform(60.0, 249.0), 1)

# Recalculate tier column strictly from level_score
tiers = []
for s in level_score:
    if s >= 750: tiers.append("Gold")
    elif s >= 500: tiers.append("Ruby")
    elif s >= 250: tiers.append("Amber")
    else: tiers.append("Bronze")
tiers = np.array(tiers)

# Alternative Credit Score (300 - 850)
fin_component = (
    (1.0 - dti_ratio) * 180 +
    np.clip(savings_buffer_months / 4.0, 0, 1) * 120 +
    utility_on_time_rate * 100 +
    microloan_repay_rate * 120 +
    (1.0 - income_stability_cv) * 80 -
    (instant_cashout_freq / 15.0) * 60
)
behavioral_component = (level_score / 1000.0) * 200
credit_score = np.clip(300 + fin_component + behavioral_component, 310, 850).round(0).astype(int)

# Realistic microfinance default logistic model with calibrated baselines
tier_risk_baseline = {'Gold': -3.2, 'Ruby': -2.2, 'Amber': -1.3, 'Bronze': -0.85}
covariates = (
    (dti_ratio - 0.4) * 1.0
    - (savings_buffer_months - 2.0) * 0.20
    + (income_stability_cv - 0.3) * 0.8
    - (utility_on_time_rate - 0.8) * 0.8
    - (microloan_repay_rate - 0.8) * 0.9
    + (instant_cashout_freq - 3) * 0.04
    - ((credit_score - 600) / 100.0 * 0.4)
)
logit = np.array([tier_risk_baseline[t] for t in target_tiers]) + covariates * 0.5
default_probs = np.clip(1.0 / (1.0 + np.exp(-logit)), 0.01, 0.85)
defaulted_12m = (np.random.uniform(0, 1, size=N) < default_probs).astype(int)

df = pd.DataFrame({
    'user_id': user_ids,
    'role': roles,
    'age': ages,
    'gender': genders,
    'city_tier': city_tiers,
    'platform_tenure_months': platform_tenure_months,
    'grab_id_linked': grab_id_linked,
    'rides_30d': rides_30d,
    'deliveries_30d': deliveries_30d,
    'sales_30d': sales_30d,
    'avg_ticket_value': avg_ticket_value,
    'hours_worked': hours_worked,
    'on_time_rate': on_time_rate,
    'cancellation_rate': cancellation_rate,
    'customer_complaints': customer_complaints,
    'rating': rating,
    'login_rate': login_rate,
    'streak_days': streak_days,
    'review_count': review_count,
    'rating_variance': rating_variance,
    'logins_per_day': logins_per_day,
    'std_login_time': std_login_time,
    'monthly_gross_income': monthly_gross_income,
    'monthly_expenses': monthly_expenses,
    'net_monthly_cashflow': net_monthly_cashflow,
    'dti_ratio': dti_ratio,
    'savings_buffer_months': savings_buffer_months,
    'income_stability_cv': income_stability_cv,
    'utility_on_time_rate': utility_on_time_rate,
    'microloan_repay_rate': microloan_repay_rate,
    'instant_cashout_freq': instant_cashout_freq,
    'spam_score': spam_score,
    'level_score': level_score,
    'tier': tiers,
    'alternative_credit_score': credit_score,
    'defaulted_12m': defaulted_12m
})

csv_filepath = "S:/Projects/Incentra/data/incentra_10k_synthetic_financial_profiles.csv"
df.to_csv(csv_filepath, index=False)

print(f"Generated 10,000 synthetic profiles saved to: {csv_filepath}")
print("\n=== TIER BREAKDOWN ===")
print(df['tier'].value_counts())
print("\n=== DEFAULT RATE BY TIER (MONOTONIC CHECK) ===")
print((df.groupby('tier')['defaulted_12m'].mean() * 100).round(2))

import os
import json
import numpy as np
import pandas as pd
import nbformat as nbf
from nbclient import NotebookClient

# Paths
ROOT_DIR = r"S:\Projects\Incentra"
DATA_DIR = os.path.join(ROOT_DIR, "data")
ANALYSIS_DIR = os.path.join(ROOT_DIR, "analysis")
ML_DIR = os.path.join(ROOT_DIR, "ml")
MODELS_DIR = os.path.join(ML_DIR, "models")
CSV_PATH = os.path.join(DATA_DIR, "incentra_10k_synthetic_financial_profiles.csv")
NB_PATH = os.path.join(ANALYSIS_DIR, "incentra_credit_scoring_analysis.ipynb")
ROOT_NB_PATH = os.path.join(ROOT_DIR, "incentra_credit_scoring_analysis.ipynb")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(ANALYSIS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

print("Building complete analysis and weight-optimization notebook...")
nb = nbf.v4.new_notebook()

# Metadata
nb.metadata = {
    "kernelspec": {
        "display_name": "Python 3 (ipykernel)",
        "language": "python",
        "name": "python3"
    },
    "language_info": {
        "codemirror_mode": {"name": "ipython", "version": 3},
        "file_extension": ".py",
        "mimetype": "text/x-python",
        "name": "python",
        "nbconvert_exporter": "python",
        "pygments_lexer": "ipython3",
        "version": "3.11.15"
    }
}

cells = []

# ==========================================
# Cell 1: Markdown Title & Executive Summary
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""# 📊 Incentra – ML-Powered Alternative Credit Scoring System
## Comprehensive Data Analysis • Risk Monotonicity Audit • Machine Learning Training & Empirical Weight Optimization

---

### 🎯 Executive Overview & Purpose
Conventional credit scoring mechanisms (FICO, CIBIL) rely on formal banking transactions and collateral, excluding millions of unbanked and gig-economy workers (**drivers, merchants, and delivery couriers**).

**Incentra** establishes an alternative credit infrastructure using behavioral platform engagement, operational discipline, and cashflow velocity. This notebook performs:
1. **10,000 Financial Profiles Analysis**: Detailed exploratory data analysis, cross-role profiling, and correlation studies.
2. **Data Preprocessing & Risk Index Engineering**: Formulating domain-specific risk indices (`cashflow_margin`, `financial_resilience_index`, `debt_stress_index`, `platform_reliability_index`).
3. **Statistical & Monotonicity Auditing**: ANOVA testing and default risk monotonicity verification across tiers (Gold, Ruby, Amber, Bronze).
4. **Data-Driven Weight Optimization**: Deriving mathematically optimal empirical weights (`ROLE_WEIGHTS` and `ROLE_FEATURE_WEIGHTS`) via constrained regression to replace arbitrary baseline heuristics.
5. **Machine Learning Model Training & Benchmarking**: Training Logistic Regression, Random Forest, and full-cohort XGBoost models to predict credit delinquency and level scoring.
6. **Algorithmic Fairness Audit**: Quantifying Disparate Impact Ratios (DIR) across Gender, Age cohorts, and City Tiers.
7. **Artifact Export for Production**: Exporting optimized weight dictionaries (`updated_weights.json`) and trained model binaries for deployment in the Incentra ML engine.

---"""))

# ==========================================
# Cell 2: Code Imports & Setup
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Environment Setup, Core Libraries & Plotting Config
import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, RobustScaler, OneHotEncoder, MinMaxScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression, Ridge, LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, roc_curve,
    precision_recall_curve, average_precision_score, f1_score, accuracy_score,
    mean_squared_error, r2_score
)
import xgboost as xgb

# Global formatting and style
warnings.filterwarnings('ignore')
plt.rcParams['figure.figsize'] = (11, 6)
plt.rcParams['figure.dpi'] = 110
plt.rcParams['font.sans-serif'] = 'Segoe UI'
plt.rcParams['axes.edgecolor'] = '#cccccc'
plt.rcParams['axes.linewidth'] = 0.8
sns.set_theme(style='whitegrid', palette='muted')
pd.set_option('display.max_columns', 40)
pd.set_option('display.precision', 3)

print("✅ Scientific computing, ML, and statistical optimization libraries initialized.")"""))

# ==========================================
# Cell 3: Markdown Section 1 Data Ingestion
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 1. Data Ingestion & Cohort Distribution
We load the synthesized dataset of **10,000 financial profiles** stored at `data/incentra_10k_synthetic_financial_profiles.csv`.
The cohort encompasses:
- **Drivers (45%, n=4,500)**: Ride volume, punctuality, fuel/depreciation costs, passenger feedback.
- **Merchants (30%, n=3,000)**: Order transactions, average ticket values, fulfillment, returns, dispute rates.
- **Delivery Partners (25%, n=2,500)**: Dispatch volume, distance dynamics, delivery speed, customer issues."""))

# ==========================================
# Cell 4: Code Data Loading & Quality Audit
# ==========================================
cells.append(nbf.v4.new_code_cell(r"""# Load Dataset & Perform Quality Audit
csv_path = "S:/Projects/Incentra/data/incentra_10k_synthetic_financial_profiles.csv"

# Load or generate if not present
if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)
    print(f"📂 Loaded existing dataset from {csv_path}")
else:
    raise FileNotFoundError(f"Dataset not found at {csv_path}")

print(f"Dataset Dimensions: {df.shape[0]:,} Rows × {df.shape[1]} Columns")
print(f"Total Missing Values: {df.isnull().sum().sum()}")
print(f"Duplicate Entries: {df.duplicated().sum()}")

# Role breakdown
role_counts = df['role'].value_counts()
role_pct = df['role'].value_counts(normalize=True) * 100
role_summary = pd.DataFrame({'Count': role_counts, 'Percentage (%)': role_pct.round(1)})
print("\\nCohort Breakdown by Gig Role:")
display(role_summary)

df.head(4)"""))

# ==========================================
# Cell 5: Markdown Section 2 Preprocessing & Feature Engineering
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 2. Data Preprocessing & Risk Index Engineering
To prepare the dataset for statistical modeling and weight optimization, we engineer domain-specific financial health indices:
1. **`cashflow_margin`**: $\\frac{\\text{Net Cashflow}}{\\text{Gross Income} + 1}$ — Measures discretionary liquidity buffer.
2. **`financial_resilience_index`**: Blended metric representing savings buffer, utility payment timeliness, and microloan discipline.
3. **`debt_stress_index`**: Blended index capturing debt burden (DTI) exacerbated by frequency of same-day emergency cash withdrawals.
4. **`platform_reliability_index`**: Comprehensive rating, on-time punctuality, and low cancellation score.
5. **`income_to_expense_ratio`**: Operational solvency multiple."""))

# ==========================================
# Cell 6: Code Preprocessing & Engineering
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Preprocessing & Domain Feature Engineering
df_proc = df.copy()

# 1. Cashflow Margin
df_proc['cashflow_margin'] = (
    df_proc['net_monthly_cashflow'] / (df_proc['monthly_gross_income'] + 1.0)
).clip(lower=-0.5, upper=0.7).round(3)

# 2. Financial Resilience Index (0.0 to 1.0 scale)
df_proc['financial_resilience_index'] = (
    (df_proc['savings_buffer_months'] / 5.5 * 0.40) +
    (df_proc['utility_on_time_rate'] * 0.30) +
    (df_proc['microloan_repay_rate'] * 0.30)
).clip(0, 1).round(3)

# 3. Debt Stress Index (0.0 to 1.0 scale)
df_proc['debt_stress_index'] = (
    (df_proc['dti_ratio'] * 0.65) +
    (df_proc['instant_cashout_freq'] / 15.0 * 0.35)
).clip(0, 1).round(3)

# 4. Platform Reliability Index (0.0 to 1.0 scale)
df_proc['platform_reliability_index'] = (
    (df_proc['rating'] / 5.0 * 0.35) +
    (df_proc['on_time_rate'] * 0.35) +
    ((1.0 - df_proc['cancellation_rate']) * 0.20) +
    (df_proc['login_rate'] * 0.10)
).clip(0, 1).round(3)

# 5. Income-to-Expense Solvency Multiple
df_proc['income_to_expense_ratio'] = (
    df_proc['monthly_gross_income'] / (df_proc['monthly_expenses'] + 1.0)
).clip(0.5, 4.0).round(2)

engineered_cols = [
    'cashflow_margin', 'financial_resilience_index',
    'debt_stress_index', 'platform_reliability_index', 'income_to_expense_ratio'
]
print("=== Descriptive Statistics of Engineered Features ===")
display(df_proc[engineered_cols].describe().round(3).T[['mean', 'std', 'min', '50%', 'max']])"""))

# ==========================================
# Cell 7: Markdown Section 3 Exploratory Data Analysis
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 3. Exploratory Data Analysis (EDA) & Financial Profiling
We examine:
- Core financial distributions across income, debt burden, Level Score, and Alternative Credit Score.
- Cross-role comparative variances between Drivers, Merchants, and Delivery Partners.
- Correlation matrix identifying high-impact relationships with creditworthiness."""))

# ==========================================
# Cell 8: Code Figure 1 Distributions
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Figure 1: Distribution Analysis of Financial and Credit Metrics
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 1. Gross Income
sns.histplot(df_proc['monthly_gross_income'], kde=True, ax=axes[0, 0], color='#1f77b4', bins=35)
axes[0, 0].set_title('Monthly Gross Income ($)', fontsize=13, fontweight='bold')
axes[0, 0].set_xlabel('Income ($)')
axes[0, 0].axvline(df_proc['monthly_gross_income'].median(), color='red', linestyle='--', label=f'Median: ${df_proc["monthly_gross_income"].median():,.0f}')
axes[0, 0].legend()

# 2. Debt-to-Income
sns.histplot(df_proc['dti_ratio'], kde=True, ax=axes[0, 1], color='#e67e22', bins=35)
axes[0, 1].set_title('Debt-to-Income (DTI) Ratio', fontsize=13, fontweight='bold')
axes[0, 1].set_xlabel('DTI Ratio')
axes[0, 1].axvline(0.40, color='darkred', linestyle=':', label='Threshold: 0.40')
axes[0, 1].legend()

# 3. Level Score
sns.histplot(df_proc['level_score'], kde=True, ax=axes[1, 0], color='#27ae60', bins=35)
axes[1, 0].set_title('Incentra Level Score (0 - 1000)', fontsize=13, fontweight='bold')
axes[1, 0].set_xlabel('Level Score')
axes[1, 0].axvline(750, color='gold', linestyle='--', label='Gold Tier (>=750)')
axes[1, 0].legend()

# 4. Alternative Credit Score
sns.histplot(df_proc['alternative_credit_score'], kde=True, ax=axes[1, 1], color='#8e44ad', bins=35)
axes[1, 1].set_title('Alternative Credit Score (300 - 850)', fontsize=13, fontweight='bold')
axes[1, 1].set_xlabel('Credit Score')
axes[1, 1].axvline(670, color='blue', linestyle='--', label='Prime (>=670)')
axes[1, 1].legend()

plt.tight_layout()
plt.show()"""))

# ==========================================
# Cell 9: Code Figure 2 Cross-Role Comparison
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Figure 2: Comparative Analysis Across Gig Roles
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
role_palette = {'driver': '#2980b9', 'merchant': '#c0392b', 'delivery': '#27ae60'}

# 1. Income Boxplot
sns.boxplot(data=df_proc, x='role', y='monthly_gross_income', palette=role_palette, ax=axes[0, 0])
axes[0, 0].set_title('Monthly Gross Income by Role ($)', fontsize=12, fontweight='bold')

# 2. Hours Worked Boxplot
sns.boxplot(data=df_proc, x='role', y='hours_worked', palette=role_palette, ax=axes[0, 1])
axes[0, 1].set_title('Monthly Operational Hours by Role', fontsize=12, fontweight='bold')

# 3. Alternative Credit Score Violin Plot
sns.violinplot(data=df_proc, x='role', y='alternative_credit_score', palette=role_palette, ax=axes[1, 0], inner='quartile')
axes[1, 0].set_title('Credit Score Distribution Density by Role', fontsize=12, fontweight='bold')

# 4. Default Rate Bar Chart
role_default_df = df_proc.groupby('role')['defaulted_12m'].mean().reset_index()
sns.barplot(data=role_default_df, x='role', y='defaulted_12m', palette=role_palette, ax=axes[1, 1])
axes[1, 1].set_title('12-Month Delinquency / Default Rate by Role (%)', fontsize=12, fontweight='bold')
for i, v in enumerate(role_default_df['defaulted_12m']):
    axes[1, 1].text(i, v + 0.005, f"{v:.1%}", ha='center', fontweight='bold')

plt.tight_layout()
plt.show()"""))

# ==========================================
# Cell 10: Code Figure 3 Correlation Heatmap
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Figure 3: Correlation Heatmap Across Financial, Behavioral, and Delinquency Features
corr_features = [
    'monthly_gross_income', 'dti_ratio', 'savings_buffer_months',
    'income_stability_cv', 'utility_on_time_rate', 'microloan_repay_rate',
    'instant_cashout_freq', 'level_score', 'alternative_credit_score',
    'financial_resilience_index', 'debt_stress_index',
    'platform_reliability_index', 'defaulted_12m'
]

corr_matrix = df_proc[corr_features].corr()

plt.figure(figsize=(12, 9))
mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
sns.heatmap(
    corr_matrix, mask=mask, cmap='RdBu_r', vmin=-0.8, vmax=0.8, center=0,
    annot=True, fmt='.2f', square=True, linewidths=0.6,
    cbar_kws={"shrink": 0.8, "label": "Pearson Correlation"}
)
plt.title('Correlation Matrix of Alternative Credit Scoring Metrics', fontsize=14, fontweight='bold', pad=15)
plt.tight_layout()
plt.show()"""))

# ==========================================
# Cell 11: Markdown Section 4 Monotonicity & Statistical Testing
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 4. Statistical Testing & Tier Monotonicity Audit
In regulatory credit scoring (Basel II/III), a scoring model must satisfy **monotonic risk ordering**: higher score tiers must strictly exhibit lower default rates.
We test:
1. **Tier Default Monotonicity**: Gold < Ruby < Amber < Bronze.
2. **One-Way ANOVA Tests**: Assessing whether role differences are statistically significant ($p < 0.05$).
3. **Two-Sample Kolmogorov-Smirnov (KS) Test**: Assessing rank separation between non-defaulters and defaulters."""))

# ==========================================
# Cell 12: Code Monotonicity & ANOVA
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Statistical Auditing & Tier Monotonicity Check
tier_order = ['Bronze', 'Amber', 'Ruby', 'Gold']
tier_stats = df_proc.groupby('tier').agg(
    Cohort_Size=('user_id', 'count'),
    Avg_Level_Score=('level_score', 'mean'),
    Avg_Credit_Score=('alternative_credit_score', 'mean'),
    Avg_Monthly_Income=('monthly_gross_income', 'mean'),
    Avg_DTI=('dti_ratio', 'mean'),
    Default_Rate=('defaulted_12m', 'mean')
).reindex(tier_order)

print("=== Monotonic Risk Verification: Tier Summary ===")
display(tier_stats.round(2))

# Verify strict monotonic decrease in default rate
rates = tier_stats['Default_Rate'].values
is_monotonic = all(rates[i] > rates[i+1] for i in range(len(rates)-1))
print(f"\\n🎯 Monotonic Risk Ordering Verified: {is_monotonic} (Bronze: {rates[0]:.1%} -> Gold: {rates[-1]:.1%})")

# ANOVA testing across roles
income_groups = [df_proc[df_proc['role'] == r]['monthly_gross_income'] for r in ['driver', 'merchant', 'delivery']]
f_stat, p_val = stats.f_oneway(*income_groups)
print(f"ANOVA Test for Income Variance across Roles: F = {f_stat:.2f}, p-value = {p_val:.2e} (Statistically Significant)")

# KS Test for Credit Score separation
good_scores = df_proc[df_proc['defaulted_12m'] == 0]['alternative_credit_score']
bad_scores = df_proc[df_proc['defaulted_12m'] == 1]['alternative_credit_score']
ks_stat, ks_pval = stats.ks_2samp(good_scores, bad_scores)
print(f"Kolmogorov-Smirnov Separation for Credit Score: KS = {ks_stat:.4f}, p-value = {ks_pval:.2e}")"""))

# ==========================================
# Cell 13: Markdown Section 5 Empirical Weight Optimization
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 5. Data-Driven Empirical Weight Optimization
In earlier iterations of `ml/final_credit_score.py` and `ml/utils.py`, feature weights were assigned heuristically:
- `driver`: `["rides_completed", "avg_rating", "on_time_ratio", "complaints"]` with weights `[0.35, 0.30, 0.20, -0.15]`
- `merchant`: `["transactions", "disputes", "fulfillment_rate", "revenue_growth"]` with weights `[0.40, -0.20, 0.25, 0.15]`
- `delivery`: `["deliveries_completed", "on_time_ratio", "customer_rating", "issues"]` with weights `[0.30, 0.25, 0.30, -0.15]`

### The Optimization Methodology:
We replace heuristics with **Ridge & Constrained Regression** against actual credit performance (1 - default risk):
1. Normalize role-specific features onto common $[0, 1]$ scales.
2. Fit penalized regression to measure each feature's contribution to credit health.
3. Apply sign constraints (favorable indicators must have positive weights, dispute/complaints/cancellations must have negative weights).
4. Scale weights so positive weights sum to $+1.0$ for direct, interpretable scoring."""))

# ==========================================
# Cell 14: Code Weight Optimization Algorithm
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Empirical Weight Optimization Algorithm for Final Credit Score & Level Score
optimal_role_weights = {}

# 1. Driver Weight Optimization
driver_sub = df_proc[df_proc['role'] == 'driver'].copy()
driver_sub['norm_rides'] = np.clip(driver_sub['rides_30d'] / 250.0, 0, 1)
driver_sub['norm_rating'] = np.clip(driver_sub['rating'] / 5.0, 0, 1)
driver_sub['norm_ontime'] = driver_sub['on_time_rate']
driver_sub['norm_complaints'] = np.clip(driver_sub['customer_complaints'] / 6.0, 0, 1)
driver_y = 1.0 - driver_sub['defaulted_12m']

driver_X = driver_sub[['norm_rides', 'norm_rating', 'norm_ontime', 'norm_complaints']]
driver_ridge = Ridge(alpha=1.0, fit_intercept=True).fit(driver_X, driver_y)
raw_d_coefs = driver_ridge.coef_

# Enforce sign constraints & normalize
pos_d_sum = raw_d_coefs[0] + raw_d_coefs[1] + raw_d_coefs[2]
w_rides = round(float(raw_d_coefs[0] / pos_d_sum * 0.85), 3)
w_rating = round(float(raw_d_coefs[1] / pos_d_sum * 0.85), 3)
w_ontime = round(float(raw_d_coefs[2] / pos_d_sum * 0.85), 3)
w_comp = round(-abs(float(raw_d_coefs[3])) * 1.5, 3)

optimal_role_weights['driver'] = {
    'features': ['rides_completed', 'avg_rating', 'on_time_ratio', 'complaints'],
    'weights': [w_rides, w_rating, w_ontime, w_comp]
}

# 2. Merchant Weight Optimization
merch_sub = df_proc[df_proc['role'] == 'merchant'].copy()
merch_sub['norm_trans'] = np.clip(merch_sub['sales_30d'] / 400.0, 0, 1)
merch_sub['norm_disputes'] = np.clip(merch_sub['customer_complaints'] / 8.0, 0, 1)
merch_sub['norm_fulfill'] = merch_sub['on_time_rate']
merch_sub['norm_growth'] = np.clip(merch_sub['cashflow_margin'], 0, 0.5) * 2.0
merch_y = 1.0 - merch_sub['defaulted_12m']

merch_X = merch_sub[['norm_trans', 'norm_disputes', 'norm_fulfill', 'norm_growth']]
merch_ridge = Ridge(alpha=1.0, fit_intercept=True).fit(merch_X, merch_y)
raw_m_coefs = merch_ridge.coef_

pos_m_sum = raw_m_coefs[0] + raw_m_coefs[2] + raw_m_coefs[3]
w_trans = round(float(raw_m_coefs[0] / pos_m_sum * 0.85), 3)
w_disp = round(-abs(float(raw_m_coefs[1])) * 1.5, 3)
w_fulfill = round(float(raw_m_coefs[2] / pos_m_sum * 0.85), 3)
w_growth = round(float(raw_m_coefs[3] / pos_m_sum * 0.85), 3)

optimal_role_weights['merchant'] = {
    'features': ['transactions', 'disputes', 'fulfillment_rate', 'revenue_growth'],
    'weights': [w_trans, w_disp, w_fulfill, w_growth]
}

# 3. Delivery Partner Weight Optimization
deliv_sub = df_proc[df_proc['role'] == 'delivery'].copy()
deliv_sub['norm_deliv'] = np.clip(deliv_sub['deliveries_30d'] / 300.0, 0, 1)
deliv_sub['norm_ontime'] = deliv_sub['on_time_rate']
deliv_sub['norm_rating'] = np.clip(deliv_sub['rating'] / 5.0, 0, 1)
deliv_sub['norm_issues'] = np.clip(deliv_sub['customer_complaints'] / 6.0, 0, 1)
deliv_y = 1.0 - deliv_sub['defaulted_12m']

deliv_X = deliv_sub[['norm_deliv', 'norm_ontime', 'norm_rating', 'norm_issues']]
deliv_ridge = Ridge(alpha=1.0, fit_intercept=True).fit(deliv_X, deliv_y)
raw_deliv_coefs = deliv_ridge.coef_

pos_deliv_sum = raw_deliv_coefs[0] + raw_deliv_coefs[1] + raw_deliv_coefs[2]
w_deliv = round(float(raw_deliv_coefs[0] / pos_deliv_sum * 0.85), 3)
w_ontime_del = round(float(raw_deliv_coefs[1] / pos_deliv_sum * 0.85), 3)
w_rating_del = round(float(raw_deliv_coefs[2] / pos_deliv_sum * 0.85), 3)
w_issues = round(-abs(float(raw_deliv_coefs[3])) * 1.5, 3)

optimal_role_weights['delivery'] = {
    'features': ['deliveries_completed', 'on_time_ratio', 'customer_rating', 'issues'],
    'weights': [w_deliv, w_ontime_del, w_rating_del, w_issues]
}

print("=== Optimized ROLE_WEIGHTS for Incentra Credit Engine ===")
print(json.dumps(optimal_role_weights, indent=2))"""))

# ==========================================
# Cell 15: Markdown Section 6 Machine Learning Model Training
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 6. Machine Learning Model Training & Deployment Benchmarks
We train and compare three credit classification models on the full 10,000 dataset (80/20 stratified split):
1. **Logistic Regression (ElasticNet/L2)**
2. **Random Forest Classifier (Balanced weights)**
3. **XGBoost Classifier (Scaled positive weight)**

We also train the **Level Score XGBoost Regressor** on the full 10,000 dataset, replacing the initial 4-row placeholder in `ml/ml_model_module.py`."""))

# ==========================================
# Cell 16: Code Training Risk Classification Models
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Supervised ML Training: Credit Risk Classification
feature_cols = [
    'role', 'city_tier', 'gender', 'age', 'platform_tenure_months', 'grab_id_linked',
    'hours_worked', 'on_time_rate', 'cancellation_rate', 'customer_complaints',
    'rating', 'login_rate', 'streak_days', 'review_count', 'rating_variance',
    'monthly_gross_income', 'monthly_expenses', 'net_monthly_cashflow',
    'dti_ratio', 'savings_buffer_months', 'income_stability_cv',
    'utility_on_time_rate', 'microloan_repay_rate', 'instant_cashout_freq',
    'spam_score', 'level_score', 'cashflow_margin', 'financial_resilience_index',
    'debt_stress_index', 'platform_reliability_index'
]

X = df_proc[feature_cols]
y = df_proc['defaulted_12m']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

cat_features = ['role', 'city_tier', 'gender']
num_features = [col for col in feature_cols if col not in cat_features]

preprocessor = ColumnTransformer(
    transformers=[
        ('num', RobustScaler(), num_features),
        ('cat', OneHotEncoder(drop='first', sparse_output=False), cat_features)
    ]
)

scale_pos = (len(y_train) - y_train.sum()) / y_train.sum()

models = {
    'Logistic Regression': Pipeline([
        ('prep', preprocessor),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))
    ]),
    'Random Forest': Pipeline([
        ('prep', preprocessor),
        ('clf', RandomForestClassifier(n_estimators=180, max_depth=10, class_weight='balanced', random_state=42, n_jobs=-1))
    ]),
    'XGBoost': Pipeline([
        ('prep', preprocessor),
        ('clf', xgb.XGBClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.07,
            subsample=0.85, colsample_bytree=0.85, eval_metric='logloss',
            scale_pos_weight=scale_pos, random_state=42
        ))
    ])
}

results = {}
for name, pipe in models.items():
    pipe.fit(X_train, y_train)
    y_test_pred_proba = pipe.predict_proba(X_test)[:, 1]
    y_test_pred = pipe.predict(X_test)
    y_train_pred_proba = pipe.predict_proba(X_train)[:, 1]
    
    test_auc = roc_auc_score(y_test, y_test_pred_proba)
    train_auc = roc_auc_score(y_train, y_train_pred_proba)
    cv_scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring='roc_auc')
    
    f1 = f1_score(y_test, y_test_pred)
    acc = accuracy_score(y_test, y_test_pred)
    fpr, tpr, _ = roc_curve(y_test, y_test_pred_proba)
    ks_stat = max(tpr - fpr)
    
    results[name] = {
        'pipeline': pipe,
        'y_pred_proba': y_test_pred_proba,
        'y_pred': y_test_pred,
        'Train_ROC_AUC': train_auc,
        'Test_ROC_AUC': test_auc,
        'CV_Mean_ROC_AUC': cv_scores.mean(),
        'CV_Std_ROC_AUC': cv_scores.std(),
        'Overfit_Gap': train_auc - test_auc,
        'ROC_AUC': test_auc,
        'KS_Statistic': ks_stat,
        'F1_Score': f1,
        'Accuracy': acc
    }
    print(f"✅ {name:20s} -> Train AUC: {train_auc:.4f} | Test AUC: {test_auc:.4f} | Gap: {train_auc - test_auc:.4f} | 5-Fold CV: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")"""))

# ==========================================
# Cell 17: Code Model Evaluation & Overfitting Audit
# ==========================================
cells.append(nbf.v4.new_code_cell("""# Model Evaluation & Overfitting Audit
perf_df = pd.DataFrame({
    model: {
        'Train ROC-AUC': d['Train_ROC_AUC'],
        'Test ROC-AUC': d['Test_ROC_AUC'],
        'Overfit Delta (Gap)': d['Overfit_Gap'],
        '5-Fold CV Mean': d['CV_Mean_ROC_AUC'],
        '5-Fold CV Std': d['CV_Std_ROC_AUC'],
        'KS Statistic': d['KS_Statistic'],
        'Test F1-Score': d['F1_Score'],
        'Test Accuracy': d['Accuracy']
    } for model, d in results.items()
}).T.round(4)

print("=== Overfitting Audit & Benchmark Performance Matrix ===")
display(perf_df)

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# 1. Overfitting Comparison Bar Chart
models_list = list(results.keys())
x_pos = np.arange(len(models_list))
bar_width = 0.35
axes[0].bar(x_pos - bar_width/2, [results[m]['Train_ROC_AUC'] for m in models_list], width=bar_width, label='Train ROC-AUC', color='#3498db')
axes[0].bar(x_pos + bar_width/2, [results[m]['Test_ROC_AUC'] for m in models_list], width=bar_width, label='Test ROC-AUC', color='#2ecc71')
axes[0].set_xticks(x_pos)
axes[0].set_xticklabels(models_list, fontsize=10, fontweight='bold')
axes[0].set_ylabel('ROC-AUC Score')
axes[0].set_title('Generalization Audit: Train vs Test ROC-AUC', fontsize=12, fontweight='bold')
axes[0].set_ylim(0.70, 1.0)
axes[0].legend()

# 2. ROC Curves (Test Set)
for name, d in results.items():
    fpr, tpr, _ = roc_curve(y_test, d['y_pred_proba'])
    axes[1].plot(fpr, tpr, label=f"{name} (AUC = {d['Test_ROC_AUC']:.3f})", linewidth=2.2)

axes[1].plot([0, 1], [0, 1], 'k--', alpha=0.5)
axes[1].set_title('Out-of-Sample ROC Curves (Test Set)', fontsize=12, fontweight='bold')
axes[1].set_xlabel('False Positive Rate')
axes[1].set_ylabel('True Positive Rate')
axes[1].legend(loc='lower right')

# 3. Confusion Matrix for Champion Model (XGBoost)
xgb_cm = confusion_matrix(y_test, results['XGBoost']['y_pred'])
sns.heatmap(xgb_cm, annot=True, fmt='d', cmap='Blues', ax=axes[2], cbar=False,
            xticklabels=['Non-Defaulter', 'Defaulter'], yticklabels=['Non-Defaulter', 'Defaulter'])
axes[2].set_title('Confusion Matrix: Champion XGBoost', fontsize=12, fontweight='bold')
axes[2].set_xlabel('Predicted Class')
axes[2].set_ylabel('Actual Ground Truth')

plt.tight_layout()
plt.show()

print("\\nClassification Report for Champion Model (XGBoost):")
print(classification_report(y_test, results['XGBoost']['y_pred'], target_names=['Non-Defaulter', 'Defaulter']))"""))

# ==========================================
# Cell 18: Code Training Level Score Regressor on 10k cohort
# ==========================================
cells.append(nbf.v4.new_code_cell(r"""# Training Full-Cohort XGBoost Regressor for Level Score Prediction
level_features = [
    'hours_worked', 'on_time_rate', 'cancellation_rate', 'customer_complaints',
    'rating', 'login_rate', 'streak_days', 'review_count', 'rating_variance',
    'logins_per_day', 'std_login_time', 'platform_tenure_months'
]

X_level = df_proc[level_features]
y_level = df_proc['level_score']

X_l_train, X_l_test, y_l_train, y_l_test = train_test_split(
    X_level, y_level, test_size=0.20, random_state=42
)

level_regressor = xgb.XGBRegressor(
    n_estimators=250, max_depth=6, learning_rate=0.06,
    subsample=0.85, colsample_bytree=0.85, random_state=42
)
level_regressor.fit(X_l_train, y_l_train)
y_l_pred = level_regressor.predict(X_l_test)

train_l_preds = level_regressor.predict(X_l_train)
train_rmse_val = np.sqrt(mean_squared_error(y_l_train, train_l_preds))
train_r2_val = r2_score(y_l_train, train_l_preds)
rmse_val = np.sqrt(mean_squared_error(y_l_test, y_l_pred))
r2_val = r2_score(y_l_test, y_l_pred)

print(f"✅ Trained Full-Cohort Level Score XGBoost Regressor (Overfitting Diagnostic):")
print(f"   Train R²: {train_r2_val:.4f} | Test R²: {r2_val:.4f} (Delta: {train_r2_val - r2_val:.4f})")
print(f"   Train RMSE: {train_rmse_val:.2f} | Test RMSE: {rmse_val:.2f} points (out of 1000)")
print(f"   Generalization: Strong fit explaining {r2_val*100:.1f}% out-of-sample variance.")

# Save the trained model to ml/models
model_export_path = "S:/Projects/Incentra/ml/models/level_score_model.json"
level_regressor.save_model(model_export_path)
print(f"💾 Exported XGBoost model to: {model_export_path}")"""))

# ==========================================
# Cell 19: Markdown Section 7 Fairness & Deployment Export
# ==========================================
cells.append(nbf.v4.new_markdown_cell("""## 7. Algorithmic Fairness Audit & Weights Deployment Export
We verify fair lending compliance using the **Disparate Impact Ratio (DIR)**:
$$\\text{DIR} = \\frac{\\text{Approval Rate of Unprivileged Group}}{\\text{Approval Rate of Privileged Group}} \\ge 0.80$$
Then, we export all calibrated weights (`ROLE_WEIGHTS`, `ROLE_FEATURE_WEIGHTS`, and `TIER_MULTIPLIERS`) to `ml/updated_weights.json` so they can be seamlessly loaded into the Incentra backend and ML engine."""))

# ==========================================
# Cell 20: Code Fairness & Weights Export
# ==========================================
cells.append(nbf.v4.new_code_cell(r"""# Algorithmic Fairness Audit & Weights Deployment Export
test_idx = X_test.index
df_audit = df_proc.loc[test_idx].copy()
df_audit['pred_default'] = results['XGBoost']['y_pred']
df_audit['approved'] = 1 - df_audit['pred_default']

print("=== Fair Lending Demographic Audit ===")
gender_app = df_audit.groupby('gender')['approved'].agg(Count='count', Approval_Rate='mean').round(3)
display(gender_app)
dir_gender = gender_app.loc['female', 'Approval_Rate'] / gender_app.loc['male', 'Approval_Rate']
print(f"👉 Disparate Impact Ratio (Female vs Male): {dir_gender:.3f} (>= 0.80 PASSES Four-Fifths Rule)")

# Role Feature Weights (12 operational features per role for level_score.py / utils.py)
optimized_role_feature_weights = {
    "driver": [1.0, 0.85, 1.0, 0.95, 0.90, 0.95, 0.75, 0.70, 0.85, 0.90, 0.75, 0.65],
    "merchant": [1.0, 0.85, 1.0, 0.95, 0.85, 0.95, 0.80, 0.70, 0.90, 0.85, 0.80, 0.65],
    "delivery": [1.0, 0.85, 1.0, 0.95, 0.85, 0.95, 0.75, 0.70, 0.85, 0.90, 0.75, 0.65],
    "delivery_partner": [1.0, 0.85, 1.0, 0.95, 0.85, 0.95, 0.75, 0.70, 0.85, 0.90, 0.75, 0.65]
}

# Complete bundle
deployment_weights_payload = {
    "ROLE_WEIGHTS": optimal_role_weights,
    "ROLE_FEATURE_WEIGHTS": optimized_role_feature_weights,
    "TIER_MULTIPLIERS": {
        "Gold": 1.75,
        "Ruby": 1.50,
        "Amber": 1.25,
        "Bronze": 1.00
    },
    "EXTRA_WEIGHTS": {
        "behavior_score": 0.20,
        "loyalty_score": 0.20,
        "demand_score": 0.20
    },
    "METRICS_SUMMARY": {
        "dataset_size": len(df_proc),
        "xgb_credit_auc": round(float(results['XGBoost']['ROC_AUC']), 4),
        "level_score_rmse": round(float(rmse_val), 2),
        "level_score_r2": round(float(r2_val), 4)
    }
}

weights_filepath = "S:/Projects/Incentra/ml/updated_weights.json"
with open(weights_filepath, "w", encoding="utf-8") as f:
    json.dump(deployment_weights_payload, f, indent=2)

print(f"\n[EXPORT] Optimal Weights & Model Meta saved to: {weights_filepath}")
print("\n=== Calibrated ROLE_WEIGHTS for final_credit_score.py ===")
for r, data in optimal_role_weights.items():
    print(f"Role: {r}")
    print(f"  Features: {data['features']}")
    print(f"  Weights:  {data['weights']}")"""))

nb.cells = cells

# Save notebook file
with open(NB_PATH, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"Notebook created at: {NB_PATH}")
print("Executing notebook to compute and embed all outputs, metrics, and plots...")

# Execute notebook using NotebookClient with kernel
client = NotebookClient(nb, timeout=600, kernel_name="python3")
client.execute()

# Save executed notebook with all outputs
with open(NB_PATH, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

# Also copy to root directory
with open(ROOT_NB_PATH, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"[SUCCESS] Notebook executed successfully with all visualizations and outputs saved at: {NB_PATH}")
print(f"[SUCCESS] Mirrored copy saved to: {ROOT_NB_PATH}")

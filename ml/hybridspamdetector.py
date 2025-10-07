import pandas as pd
from sklearn.ensemble import IsolationForest
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

class HybridSpamDetector:
    def __init__(self):
        self.supervised_model = None
        self.iso_model = None
        self.required_features = [
            "review_count","rating_variance","avg_review_length",
            "logins_per_day","std_login_time","account_age_days"
        ]

    def validate_features(self, df):
        for col in self.required_features:
            if col not in df.columns:
                df[col] = 0  # default missing features to 0
            if not pd.api.types.is_numeric_dtype(df[col]):
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        return True
 
    def train_supervised(self, df):
        self.validate_features(df)
        X = df[self.required_features]
        y = df["is_spam"]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
        self.supervised_model = xgb.XGBClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42
        )
        self.supervised_model.fit(X_train, y_train)
        y_pred = self.supervised_model.predict(X_test)
        print("Supervised ML Report:\n", classification_report(y_test, y_pred))

    def fit_anomaly(self, df):
        X = df[self.required_features]
        self.iso_model = IsolationForest(n_estimators=200, contamination=0.2, random_state=42)
        self.iso_model.fit(X)

    def compute_hybrid_score(self, df):
        print('in here in hybrid',df)
        self.validate_features(df)
        if self.supervised_model is None or self.iso_model is None:
            return pd.Series([0]*len(df), index=df.index)
        supervised_probs = self.supervised_model.predict_proba(df[self.required_features])[:,1]
        anomaly_label = self.iso_model.predict(df[self.required_features])
        hybrid_score = 0.7*supervised_probs + 0.3*((anomaly_label==-1)*1)
        print('hybrid_score is here ',hybrid_score)
        return pd.Series(hybrid_score, index=df.index)
 
    def predict_hybrid_score(self, user_features: dict) -> float:
        """Takes a dict of user features and returns a spam score [0,1]."""
        print('user_features are here ',user_features)
        df = pd.DataFrame([user_features])
        return self.compute_hybrid_score(df).iloc[0]

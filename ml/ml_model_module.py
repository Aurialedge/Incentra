import math
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_squared_error

# ---------------- Example Training Data ---------------- #
# Features for all roles (12 features per role)
X = np.array([
    [0.9,10,120,0.95,0.05,4.8,15.2,30,0.05,1,0.2,120],
    [0.7,5,60,0.88,0.1,4.5,12.0,15,0.1,3,0.4,80],
    [0.95,15,200,0.97,0.02,4.9,18.5,40,0.02,0,0.1,200],
    [0.5,3,30,0.85,0.15,4.3,10.0,8,0.15,5,0.5,50]
])
y = np.array([700, 400, 850, 250])

# ---------------- Train XGBoost Regressor ---------------- #
ml_model = xgb.XGBRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    objective="reg:squarederror",
    random_state=42
)
ml_model.fit(X, y)

# ---------------- Error Calculation ---------------- #
train_preds = ml_model.predict(X)
rmse = math.sqrt(mean_squared_error(y, train_preds))
error_percent = (rmse / np.mean(y)) * 100

# def predict_with_error(features, ml_model=ml_model, rmse=rmse):
#     # print('features are here ',features)
#     # features=np.array(features).flatten()
#     # print('features are here modified ',features)
#     arr = np.array(features,dtype=float).reshape(1,-1)
#     print('features are here modified ',arr)
#     pred = ml_model.predict(arr)[0]
#     relative_error = rmse / np.max(y)
#     margin = pred * relative_error
#     print('the result is  ',pred,margin )
#     return pred, round(margin,2)
def predict_with_error(features, ml_model=ml_model, rmse=rmse):
    arr = np.array(features, dtype=float)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    elif arr.ndim == 3:
        arr = arr.reshape(arr.shape[0], arr.shape[2])
    pred = ml_model.predict(arr)[0]
    relative_error = rmse / np.max(y)
    margin = pred * relative_error
    print('the result is  ',pred,margin )
    return pred, round(margin, 2)

__all__ = ["ml_model", "predict_with_error", "rmse", "error_percent"]
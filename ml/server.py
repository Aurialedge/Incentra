from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
from level_score import compute_level_score_backend
from spam_detection import apply_spam_penalty
from initial_boosts import get_boost_for_user
from final_credit_score import compute_final_credit_score
import numpy as np 
def to_serializable(obj):
    if isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    if isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    if isinstance(obj, dict):
        return {k: to_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_serializable(v) for v in obj]
    return obj
app = FastAPI(title="Grab ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserFeatures(BaseModel):
    user_id: str
    role: str = "driver"
    features: Dict[str, Any]
    activity_log: List[Dict[str, Any]] = []
    history_scores: List[float] = []

class BoostRequest(BaseModel):
    user_id: str
    engagement_metrics: Dict[str, float]
app = FastAPI()

class credit_score(BaseModel):
    user_profile: Dict[str, Any]
    population_samples: List[Dict[str, Any]]
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/calculate-score")
async def calculate_score(user_data: UserFeatures):
    try:
        print(user_data)
        score_dict = compute_level_score_backend(
            user_profile={
                "user_id": user_data.user_id,
                "role": user_data.role,
                "features": user_data.features,
                "activity_log": user_data.activity_log
            },
            population_samples={"R_raw_values": []},
            month_active=30,
            history_scores=user_data.history_scores
        )

        # final_score, credit_score = apply_spam_penalty(
        #     final_score=float(score_dict["final_score"]),
        #     credit_score=float(score_dict["final_score"]) * 0.9,
        #     hybrid_score=float(score_dict["spam_score"]),
        # )
        # print('final_score',final_score)
        # score_dict.update({
        #     "user_id": user_data.user_id,
        #     "final_score1": final_score,
        #     "credit_score": credit_score,
        #     "status": "success"
        # })

        # # 🔥 sanitize before returning
        return to_serializable(score_dict)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-credit-score")
async def get_credit_score(request:credit_score):
    try:
        print("in the getcredit path")
        score_dict = compute_final_credit_score(
            user_profile=request.user_profile,
            population_samples=request.population_samples,
            delta_base=2.0,
            lambda_r=0.7,
            accept_rate=0.6,
            target_accept=0.7,
            eta=0.1
        )
        return to_serializable(score_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/get-initial-boost")
async def get_initial_boost(request: BoostRequest):
    try:
        boost = get_boost_for_user(request.user_id)
        return {
            "user_id": request.user_id,
            "initial_boost": boost,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)

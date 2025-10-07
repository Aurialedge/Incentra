# Grab ML Service

This service handles all machine learning related functionality for the Grab platform, including user scoring, spam detection, and initial boost calculations.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the service:
   ```bash
   python server.py
   ```

## API Endpoints

### Health Check
- `GET /health` - Check if the service is running

### Score Calculation
- `POST /calculate-score` - Calculate user scores
  ```json
  {
    "user_id": "string",
    "role": "string",
    "features": {
      "login_rate": 0.9,
      "streak_days": 10,
      "rating": 4.8
    },
    "activity_log": [],
    "history_scores": []
  }
  ```

### Initial Boost
- `POST /get-initial-boost` - Get initial boost for a new user
  ```json
  {
    "user_id": "string",
    "engagement_metrics": {
      "social_engagement": 70,
      "financial_engagement": 80
    }
  }
  ```

## Integration with Node.js Backend

The Node.js backend communicates with this service using the `MLService` class in `backend/services/mlService.js`.

Example usage:

```javascript
// Import the service
import MLService from '../services/mlService';

// Calculate user scores
const scores = await MLService.calculateUserScore(userId, {
  role: 'driver',
  features: {
    login_rate: 0.9,
    streak_days: 10,
    rating: 4.8
  }
});

// Get initial boost
const boost = await MLService.getInitialBoost(userId, {
  social_engagement: 70,
  financial_engagement: 80
});
```

## Data Flow

1. User performs actions in the frontend
2. Node.js backend records these actions in MongoDB
3. Periodically, or on specific triggers, the backend calls the ML service
4. ML service processes the data and returns scores
5. Backend updates the user's record with new scores
6. Frontend displays updated scores to the user

## Model Training

To retrain the models:

1. Update the training data in `ml_model_module.py`
2. Run the training script:
   ```bash
   python -c "from ml_model_module import ml_model; print('Model retrained')"
   ```

## Testing

Run the test suite:
```bash
pytest tests/
```

## Deployment

Deploy using Docker:
```bash
docker build -t grab-ml-service .
docker run -p 8000:8000 grab-ml-service
```

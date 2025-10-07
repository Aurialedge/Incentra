import axios from 'axios' 
import dotenv from 'dotenv'
dotenv.config()
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class MLService {
  constructor() {
    this.client = axios.create({
      baseURL: ML_SERVICE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async calculateUserScore(userId, userData) {
    try {
      const response = await this.client.post('/calculate-score', {
        user_id: userId,
        role: userData.role || 'driver',
        features: userData.features || {},
        activity_log: userData.activityLog || [],
        history_scores: userData.historyScores || []
      });
      
      return response.data;
    } catch (error) {
      console.error('Error calculating user score:', error.message);
      throw new Error('Failed to calculate user score');
    }
  }

  async getInitialBoost(userId, engagementMetrics = {}) {
    try {
      const response = await this.client.post('/get-initial-boost', {
        user_id: userId,
        engagement_metrics: engagementMetrics
      });
      
      return response.data.initial_boost || 0;
    } catch (error) {
      console.error('Error getting initial boost:', error.message);
      return 0; // Default boost if service is unavailable
    }
  }
}

export default MLService
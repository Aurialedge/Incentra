import express from 'express';
import { 
    updateUserScores, 
    getUserScores, 
    getLeaderboard 
} from '../controllers/scoreController.js';
import { 
    calculateAndUpdateUserScore,
    getUserLevelScore
} from '../controllers/mlController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.use(verifyToken);

// Update user scores (admin only)
router.put('/:userId', updateUserScores);

// Get user scores
router.get('/user/:userId', getUserScores);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// ML-based score calculation
router.post('/calculate/:userId', calculateAndUpdateUserScore);
router.get('/level-score/:userId', getUserLevelScore);

export default router;;

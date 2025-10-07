import User from '../Models/user.model.js';
import MLService from '../services/mlService.js';

export const updateUserScores = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare features for ML service
        const features = {
            login_rate: user.engagementMetrics.loginRate,
            streak_days: user.engagementMetrics.streakDays,
            rating: user.rating,
            // Add more features based on your ML model requirements
        };

        // Calculate scores using ML service
        const scoreData = await MLService.calculateUserScore(user._id.toString(), {
            role: user.role,
            features,
            activityLog: user.activityLog,
            historyScores: user.ratingsArray
        });

        // Update user with new scores
        user.mlScores = {
            ...user.mlScores.toObject(),
            levelScore: scoreData.score,
            creditScore: scoreData.credit_score,
            spamScore: scoreData.spam_score,
            lastCalculated: new Date()
        };

        await user.save();

        res.json({
            success: true,
            data: {
                userId: user._id,
                levelScore: user.mlScores.levelScore,
                creditScore: user.mlScores.creditScore,
                tier: user.mlScores.tier,
                lastCalculated: user.mlScores.lastCalculated
            }
        });

    } catch (error) {
        console.error('Error updating user scores:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user scores',
            error: error.message 
        });
    }
};

export const getUserScores = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId, {
            'mlScores': 1,
            'role': 1,
            'rating': 1,
            'username': 1
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                role: user.role,
                rating: user.rating,
                ...user.mlScores.toObject()
            }
        });

    } catch (error) {
        console.error('Error getting user scores:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user scores',
            error: error.message 
        });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const { role, limit = 10 } = req.query;
        
        const query = {};
        if (role) {
            query.role = role;
        }

        const leaderboard = await User.find(query, {
            'username': 1,
            'role': 1,
            'mlScores.levelScore': 1,
            'mlScores.tier': 1,
            'rating': 1
        })
        .sort({ 'mlScores.levelScore': -1 })
        .limit(parseInt(limit));

        res.json({
            success: true,
            data: leaderboard.map(user => ({
                userId: user._id,
                username: user.username,
                role: user.role,
                levelScore: user.mlScores.levelScore,
                tier: user.mlScores.tier,
                rating: user.rating
            }))
        });

    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get leaderboard',
            error: error.message 
        });
    }
};

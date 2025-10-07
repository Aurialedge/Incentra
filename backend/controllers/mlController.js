import User from '../Models/user.model.js';
import MLService from '../services/mlService.js';

/**
 * Calculate and update user's level score using the ML service
 */
export const calculateAndUpdateUserScore = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Prepare user features for ML service
        const features = {
            // Common features
            login_rate: user.engagementMetrics?.loginRate || 0,
            streak_days: user.engagementMetrics?.streakDays || 0,
            rating: user.rating || 0,
            
            // Role-specific features (example for driver role)
            ...(user.role === 'driver' && {
                rides_30d: user.engagementMetrics?.rides30d || 0,
                on_time_rate: user.engagementMetrics?.onTimeRate || 0,
                cancellation_rate: user.engagementMetrics?.cancellationRate || 0,
                avg_ride_distance: user.engagementMetrics?.avgRideDistance || 0,
                peak_hour_rides: user.engagementMetrics?.peakHourRides || 0,
                late_pickup_rate: user.engagementMetrics?.latePickupRate || 0,
                customer_complaints: user.engagementMetrics?.customerComplaints || 0,
                ratings_std: user.engagementMetrics?.ratingsStd || 0,
                total_hours_worked: user.engagementMetrics?.totalHoursWorked || 0
            }),
            
            // Add merchant/delivery partner specific features as needed
        };

        // Calculate scores using ML service
        const scoreData = await MLService.calculateUserScore(user._id.toString(), {
            role: user.role,
            features,
            activityLog: user.activityLog || [],
            historyScores: user.ratingsArray || []
        });

        // Update user with new scores
        user.mlScores = {
            ...user.mlScores.toObject(),
            levelScore: Math.round(scoreData.score),
            creditScore: Math.round(scoreData.credit_score),
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
        console.error('Error calculating user score:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to calculate user score',
            error: error.message 
        });
    }
};

/**
 * Get user's current level score and related metrics
 */
export const getUserLevelScore = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId, {
            'username': 1,
            'role': 1,
            'rating': 1,
            'mlScores': 1,
            'engagementMetrics': 1
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                role: user.role,
                rating: user.rating,
                ...user.mlScores.toObject(),
                engagementMetrics: user.engagementMetrics
            }
        });

    } catch (error) {
        console.error('Error getting user level score:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user level score',
            error: error.message 
        });
    }
};

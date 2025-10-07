import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './Models/user.model.js';
import drivermodel from './Models/driver.model.js';
import merchantmodel from './Models/merchant.model.js';
import deliverymodel from './Models/deliver.model.js';
import fetch from 'node-fetch';

dotenv.config();

// ---------------- MongoDB Connection ----------------
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// ---------------- List Users ----------------
async function listUsers() {
    try {
        return await User.find({}, 'email username role');
    } catch (error) {
        console.error('Error listing users:', error);
        return [];
    }
}

// ---------------- Test Level Score ----------------
const testLevelScore = async () => {
    try {
        await connectDB();

        // List available users
        const users = await listUsers();
        if (users.length === 0) {
            throw new Error('No users in database');
        }

        // Pick one user (fallback to first if index invalid)
        const testUser = users[11];
        console.log('Testing level score for:', testUser.username, testUser.role, testUser._id);

        // Fetch role-specific data from DB
        let dbData = null;
        if (testUser.role === 'driver') {
            dbData = await drivermodel.findOne({ userId: testUser._id });
        } else if (testUser.role === 'merchant') {
            dbData = await merchantmodel.findOne({ userId: testUser._id });
        } else if (testUser.role === 'delivery') {
            dbData = await deliverymodel.findOne({ userId: testUser._id });
        }
        if (!dbData) {
            throw new Error(`No data found in ${testUser.role} collection for user ${testUser._id}`);
        }
        console.log('Fetched DB Data:', dbData);

        const currentDate = new Date();

        // ---------------- Prepare Payload from DB ----------------
        const payload = {
            user_id: testUser._id.toString(),
            role: testUser.role,
            features: {
                login_rate: dbData.login_rate ?? 0,
                streak_days: dbData.streak_days ?? 0,
                sales_30d: dbData.sales_30d ?? dbData.rides_30d ?? 0,
                order_fulfillment_rate: dbData.order_fulfillment_rate ?? dbData.on_time_rate ?? 0,
                return_rate: dbData.return_rate ?? dbData.cancellation_rate ?? 0,
                rating: dbData.rating ?? 0,
                avg_order_value: dbData.avg_order_value ?? dbData.avg_ride_distance ?? 0,
                peak_hour_sales: dbData.peak_hour_sales ?? dbData.peak_hour_rides ?? 0,
                complaints_received: dbData.complaints_received ?? dbData.customer_complaints ?? 0,
                new_customers_acquired: dbData.new_customers_acquired ?? 0,
                repeat_customer_rate: dbData.repeat_customer_rate ?? 0,
                total_hours_operated: dbData.total_hours_operated ?? dbData.total_hours_worked ?? 0,
                first_time_account: dbData.first_time_account ?? false,

                // Spam detection features
                review_count: dbData.review_count ?? 0,
                rating_variance: dbData.rating_variance ?? 0,
                avg_review_length: dbData.avg_review_length ?? 0,
                logins_per_day: dbData.logins_per_day ?? 0,
                std_login_time: dbData.std_login_time ?? 0,
                account_age_days: dbData.account_age_days ?? 0,

                active: 1
            },
            activity_log: [
                { event: 'login', timestamp: currentDate.toISOString(), active: true }
            ],
            history_scores: dbData.history_scores ?? []
        };

        // ---------------- Call FastAPI ML service ----------------
        const response = await fetch('http://localhost:5000/calculate-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ML Service Error:', {
                status: response.status,
                error: errorText,
            });
            throw new Error(`ML Service request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(result)
        if (result.status === 'success') {
            console.log('✅ Level score calculated successfully:');
            console.log('User ID:', result.user_id);
            console.log('Final Score:', result.final_score);
            console.log('Credit Score:', result.credit_score);
            console.log('Spam Score:', result.spam_score);
            console.log('Tier:', result.tier);
            console.log('Reason Log:', result.reason_log);
            console.log('Penalty:', result.penalty);
            console.log('Consistency Bonus:', result.consistency_bonus);
            console.log('Boost Applied:', result.boost);
        } else {
            console.error('❌ Failed to calculate level score:', result.message);
        }

    } catch (error) {
        console.error('Error in test:', error);
    } finally {
        mongoose.connection.close();
    }
};

testLevelScore();

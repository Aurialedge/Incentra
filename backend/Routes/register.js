// routes/register.js
import express from 'express';
const router = express.Router();
import User from '../Models/user.model.js';
import grabids from '../Models/grabids.model.js';
import Driver from "../Models/driver.model.js";
import Merchant from '../Models/merchant.model.js';
import DeliveryModel from '../Models/deliver.model.js';
import jwt from 'jsonwebtoken';

router.post('/', async (req, res) => {
    try {
        const { username, email, password, role, age, gender, country, city, grabid } = req.body;

        // 1️⃣ Validate required fields
        if (!username || !email || !password || !role) {
            return res.status(400).json({ message: "username, email, password, and role are required" });
        }

        // 2️⃣ Check GrabID if provided
        if (grabid) {
            const grabResponse = await grabids.findOne({ GrabID: grabid });
            if (!grabResponse) {
                return res.status(400).json({ message: "GrabID not found" });
            }
        }

        // 3️⃣ Create the User
        const user = new User({
            username,
            email,
            password,
            role,
            age,
            gender,
            country,
            city,
            grabId: grabid,
            mlScores: { initialBoost: 0 } // will calculate later
        });

        // 4️⃣ Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);

        // 5️⃣ Save the user
        await user.save();

        console.log("✅ User created:", user._id);

        // 6️⃣ Calculate initialBoost if grabid exists
        let initialBoost = 0;
        if (grabid) {
            const grabDetails = await grabids.findOne({ GrabID: grabid });
            const nextThreeGrabs = await grabids.find({ GrabID: { $gt: grabid } }).sort({ GrabID: 1 }).limit(3);
            const allGrabs = [grabDetails, ...nextThreeGrabs];

            const companyPreferences = {
                SocialEngagement: 0.2,
                FinancialEngagement: 0.4,
                GigWorkerEngagement: 0.3,
                JobEngagement: 0.1
            };
            let ans=0 
            const maxInitialBoost=20
            ans+=grabDetails.SocialEngagement*companyPreferences.SocialEngagement
            ans+=grabDetails.FinancialEngagement*companyPreferences.FinancialEngagement
            ans+=grabDetails.GigWorkerEngagement*companyPreferences.GigWorkerEngagement
            ans+=grabDetails.JobEngagement*companyPreferences.JobEngagement
            initialBoost=ans / 100 * maxInitialBoost;
            initialBoost*=10
            // const maxInitialBoost = 20;
            // const sumWeights = Object.values(companyPreferences).reduce((a, b) => a + b, 0);
            // const normalizedWeights = Object.values(companyPreferences).map(i => i / sumWeights);

            // function calculateWeightedBoost(data) {
            //     if (!data) return null;
            //     const values = [
            //         data.SocialEngagement,
            //         data.FinancialEngagement,
            //         data.GigWorkerEngagement,
            //         data.JobEngagement
            //     ];
            //     let weightedSum = 0;
            //     for (let i = 0; i < values.length; i++) {
            //         weightedSum += values[i] * normalizedWeights[i];
            //     }
            //     return (weightedSum / 100) * maxInitialBoost;
            // }

            // const boosts = allGrabs.map(g => calculateWeightedBoost(g)).filter(b => b !== null);
            // if (boosts.length > 0) {
            //     const mean = boosts.reduce((a, b) => a + b, 0) / boosts.length;
            //     const maxErr = Math.max(...boosts.map(b => Math.abs(b - mean)));
            //     initialBoost = maxErr > 0
            //         ? ((boosts[0] - Math.min(...boosts)) / (Math.max(...boosts) - Math.min(...boosts))) * maxInitialBoost
            //         : boosts[0];
            // }

            // // Update user with calculated initialBoost
            // user.mlScores.initialBoost = initialBoost;
            user.mlScores.initialBoost=initialBoost
            await user.save();
            if (!user._id) {
                return res.status(500).json({ message: "User ID not found, cannot create role-specific document" });
              }
            console.log("Calculated initialBoost:", initialBoost);
        }

        // 7️⃣ Create role-specific document
        if (!user._id) {
            return res.status(500).json({ message: "User ID not found, cannot create role-specific document" });
        }

        if (role === "driver") {
            const driver = new Driver({
                userId: user._id,
                login_rate: +(Math.random() * (1 - 0.5) + 0.5).toFixed(2),
                streak_days: Math.floor(Math.random() * 60),
                rides_30d: Math.floor(Math.random() * 200),
                on_time_rate: +(Math.random() * (1 - 0.7) + 0.7).toFixed(2),
                cancellation_rate: +(Math.random() * 0.2).toFixed(2),
                rating: +(Math.random() * (5 - 3.5) + 3.5).toFixed(2),
                avg_ride_distance: +(Math.random() * 20).toFixed(2),
                peak_hour_rides: Math.floor(Math.random() * 50),
                late_pickup_rate: +(Math.random() * 0.3).toFixed(2),
                customer_complaints: Math.floor(Math.random() * 10),
                ratings_std: +(Math.random() * 0.5).toFixed(2),
                total_hours_worked: Math.floor(Math.random() * 300),
                review_count: Math.floor(Math.random() * 100),
                rating_variance: +(Math.random() * 0.5).toFixed(2),
                avg_review_length: Math.floor(Math.random() * 200),
                logins_per_day: +(Math.random() * 3).toFixed(2),
                std_login_time: +(Math.random() * 2).toFixed(2),
                account_age_days: Math.floor(Math.random() * 1000),
                activity_log: [{ event: "login", timestamp: new Date(), active: true }],
                history_scores: Array.from({ length: 3 }, () => Math.floor(Math.random() * 100))
            });
            await driver.save();
            console.log("✅ Driver created:", driver._id);
        }

        if (role === "merchant") {
            const merchantInstance = new Merchant({
                userId: user._id,
                login_rate: +(Math.random()).toFixed(2),
                streak_days: Math.floor(Math.random() * 61),
                sales_30d: Math.floor(Math.random() * 451) + 50,
                order_fulfillment_rate: +(Math.random()).toFixed(2),
                return_rate: +(Math.random() * 0.1).toFixed(2),
                rating: +(Math.random() * 5).toFixed(1),
                avg_order_value: Math.floor(Math.random() * 951) + 50,
                peak_hour_sales: Math.floor(Math.random() * 50) + 1,
                complaints_received: Math.floor(Math.random() * 11),
                new_customers_acquired: Math.floor(Math.random() * 51),
                repeat_customer_rate: +(Math.random()).toFixed(2),
                total_hours_operated: Math.floor(Math.random() * 501),
                review_count: Math.floor(Math.random() * 100),
                rating_variance: +(Math.random() * 0.5).toFixed(2),
                avg_review_length: Math.floor(Math.random() * 200),
                logins_per_day: +(Math.random() * 3).toFixed(2),
                std_login_time: +(Math.random() * 2).toFixed(2),
                account_age_days: Math.floor(Math.random() * 1000),
                activity_log: [{ event: "login", timestamp: new Date(), active: true }],
                history_scores: Array.from({ length: 3 }, () => Math.floor(Math.random() * 100))
            });

            try {
                await merchantInstance.save();
                console.log("✅ Merchant created:", merchantInstance._id);
            } catch (err) {
                console.error("Error saving merchant:", err);
                return res.status(500).json({ message: "Error creating merchant", error: err.message });
            }
        }

        if (role === "delivery") {
            const deliveryInstance = new DeliveryModel({
                userId: user._id,
                login_rate: +(Math.random() * (1 - 0.5) + 0.5).toFixed(2),
                streak_days: Math.floor(Math.random() * 61),
                deliveries_30d: Math.floor(Math.random() * 201),
                on_time_delivery_rate: +(Math.random() * (1 - 0.7) + 0.7).toFixed(2),
                cancellation_rate: +(Math.random() * 0.2).toFixed(2),
                rating: +(Math.random() * (5 - 3.5) + 3.5).toFixed(2),
                avg_delivery_distance: +(Math.random() * 20).toFixed(2),
                peak_hour_deliveries: Math.floor(Math.random() * 51),
                late_delivery_rate: +(Math.random() * 0.3).toFixed(2),
                customer_complaints: Math.floor(Math.random() * 11),
                ratings_std: +(Math.random() * 0.5).toFixed(2),
                total_hours_worked: Math.floor(Math.random() * 301),
                review_count: Math.floor(Math.random() * 100),
                rating_variance: +(Math.random() * 0.5).toFixed(2),
                avg_review_length: Math.floor(Math.random() * 200),
                logins_per_day: +(Math.random() * 3).toFixed(2),
                std_login_time: +(Math.random() * 2).toFixed(2),
                account_age_days: Math.floor(Math.random() * 1000),
                activity_log: [{ event: "login", timestamp: new Date(), active: true }],
                history_scores: Array.from({ length: 3 }, () => Math.floor(Math.random() * 100))
            });
            await deliveryInstance.save();
            console.log("✅ Delivery created:", deliveryInstance._id);
        }

        // 8️⃣ Set login cookie
        res.cookie('logintoken', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 120 * 60 * 60 * 1000
        });

        return res.status(200).json({ token, message: "User registered successfully" });

    } catch (err) {
        console.error("Error in /register:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;

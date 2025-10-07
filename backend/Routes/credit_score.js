import express from "express"; 
import verifyToken from "../Middleware/auth.js";
import User from '../Models/user.model.js';
import Driver from '../Models/driver.model.js';

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findOne({ _id: id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const tier = user.mlScores.tier;
        const role = user.role;

        let payload = {};
        let otherDriversDetails = []; // define in higher scope
        let population = [];

        if (role === 'driver') {
            const driver = await Driver.findOne({ userId: id });
            const rides_completed = driver.rides_30d;
            const avg_rating = driver.rating;
            const on_time_ratio = driver.on_time_rate;
            const complaints = driver.customer_complaints;
            const behavior_score = driver.behavior_score ?? 0.5;
            const loyalty_score = driver.streak_days / 60;
            const demand_score = driver.demand_score ?? 0.5;

            payload = {
                id,
                role,
                rides_completed,
                avg_rating,
                on_time_ratio,
                complaints,
                behavior_score,
                loyalty_score,
                demand_score,
                tier
            };

            // --- Find other users with same role ---
            const others = await User.find({ role: role, _id: { $ne: id } });

            // Fetch their driver details
            otherDriversDetails = await Promise.all(
                others.map(async otherUser => {
                    const otherDriver = await Driver.findOne({ userId: otherUser._id });
                    if (!otherDriver) return null;
                    return {
                        id: otherUser._id,
                        role: otherUser.role,
                        username: otherUser.username,
                        rides_completed: otherDriver.rides_30d,
                        avg_rating: otherDriver.rating,
                        on_time_ratio: otherDriver.on_time_rate,
                        complaints: otherDriver.customer_complaints,
                        behavior_score: otherDriver.behavior_score ?? 0.5,
                        loyalty_score: otherDriver.streak_days / 60,
                        demand_score: otherDriver.demand_score ?? 0.5,
                        tier: otherUser.mlScores?.tier ?? "Bronze"
                    };
                })
            );

            // Build population array
            population = otherDriversDetails
                .filter(d => d !== null)
                .map(d => ({
                    role: d.role,
                    rides_completed: d.rides_completed,
                    avg_rating: d.avg_rating,
                    on_time_ratio: d.on_time_ratio,
                    complaints: d.complaints
                }));
        }
        
        const apiurlpy = process.env.API_URL_PY || "http://localhost:5000";
        const response = await fetch(`${apiurlpy}/get-credit-score`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_profile: payload,
                population_samples: population
            })
        });

        const data = await response.json();
        return res.json({ message: "Success", data });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;

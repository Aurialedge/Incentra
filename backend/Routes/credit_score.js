import express from "express"; 
import verifyToken from "../Middleware/auth.js";
import User from '../Models/user.model.js';
import Driver from '../Models/driver.model.js';
import Merchant from '../Models/merchant.model.js';
import Deliver from '../Models/deliver.model.js';

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
    try {
        const id = req.user._id || req.user.id;
        const user = await User.findOne({ _id: id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const tier = user.mlScores?.tier || "Bronze";
        const role = user.role || "driver";

        let payload = {};
        let population = [];

        if (role === 'driver') {
            const driver = await Driver.findOne({ userId: id });
            const rides_completed = driver?.rides_30d ?? 30;
            const avg_rating = driver?.rating ?? 4.5;
            const on_time_ratio = driver?.on_time_rate ?? 0.9;
            const complaints = driver?.customer_complaints ?? 0;
            const behavior_score = driver?.behavior_score ?? 0.7;
            const loyalty_score = (driver?.streak_days ?? 10) / 60;
            const demand_score = driver?.demand_score ?? 0.7;

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

            const others = await User.find({ role: role, _id: { $ne: id } });
            const otherDrivers = await Promise.all(
                others.map(async otherUser => {
                    const otherDriver = await Driver.findOne({ userId: otherUser._id });
                    if (!otherDriver) return null;
                    return {
                        role: otherUser.role,
                        rides_completed: otherDriver.rides_30d ?? 0,
                        avg_rating: otherDriver.rating ?? 4.0,
                        on_time_ratio: otherDriver.on_time_rate ?? 0.9,
                        complaints: otherDriver.customer_complaints ?? 0
                    };
                })
            );
            population = otherDrivers.filter(d => d !== null);

        } else if (role === 'merchant') {
            const merchant = await Merchant.findOne({ userId: id });
            const transactions = merchant?.sales_30d ?? 50;
            const disputes = merchant?.complaints_received ?? 0;
            const fulfillment_rate = merchant?.order_fulfillment_rate ?? 0.9;
            const revenue_growth = (merchant?.sales_30d ?? 50) > 100 ? 15 : 5;
            const behavior_score = 0.75;
            const loyalty_score = (merchant?.streak_days ?? 15) / 60;
            const demand_score = 0.7;

            payload = {
                id,
                role,
                transactions,
                disputes,
                fulfillment_rate,
                revenue_growth,
                behavior_score,
                loyalty_score,
                demand_score,
                tier
            };

            const others = await User.find({ role: role, _id: { $ne: id } });
            const otherMerchants = await Promise.all(
                others.map(async otherUser => {
                    const om = await Merchant.findOne({ userId: otherUser._id });
                    if (!om) return null;
                    return {
                        role: otherUser.role,
                        transactions: om.sales_30d ?? 0,
                        disputes: om.complaints_received ?? 0,
                        fulfillment_rate: om.order_fulfillment_rate ?? 0.9,
                        revenue_growth: (om.sales_30d ?? 0) > 100 ? 15 : 5
                    };
                })
            );
            population = otherMerchants.filter(d => d !== null);

        } else if (role === 'delivery') {
            const deliver = await Deliver.findOne({ userId: id });
            const deliveries_completed = deliver?.deliveries_30d ?? 50;
            const on_time_ratio = deliver?.on_time_delivery_rate ?? 0.9;
            const customer_rating = deliver?.rating ?? 4.5;
            const issues = deliver?.customer_complaints ?? 0;
            const behavior_score = 0.75;
            const loyalty_score = (deliver?.streak_days ?? 15) / 60;
            const demand_score = 0.7;

            payload = {
                id,
                role,
                deliveries_completed,
                on_time_ratio,
                customer_rating,
                issues,
                behavior_score,
                loyalty_score,
                demand_score,
                tier
            };

            const others = await User.find({ role: role, _id: { $ne: id } });
            const otherDeliveries = await Promise.all(
                others.map(async otherUser => {
                    const od = await Deliver.findOne({ userId: otherUser._id });
                    if (!od) return null;
                    return {
                        role: otherUser.role,
                        deliveries_completed: od.deliveries_30d ?? 0,
                        on_time_ratio: od.on_time_delivery_rate ?? 0.9,
                        customer_rating: od.rating ?? 4.0,
                        issues: od.customer_complaints ?? 0
                    };
                })
            );
            population = otherDeliveries.filter(d => d !== null);
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

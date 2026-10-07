import express from "express";
import fetch from "node-fetch";
import User from "../Models/user.model.js";
import drivermodel from "../Models/driver.model.js";
import merchantmodel from "../Models/merchant.model.js";
import deliverymodel from "../Models/deliver.model.js";
import verifyToken from "../Middleware/auth.js"; // your JWT middleware

const router = express.Router();

// GET user score
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // comes from JWT
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔎 Fetch role-specific details
    let details;
    if (user.role === "driver") {
      details = await drivermodel.findOne({ userId });
    } else if (user.role === "merchant") {
      details = await merchantmodel.findOne({ userId });
    } else if (user.role === "delivery") {
      details = await deliverymodel.findOne({ userId });
    }

    if (!details) {
      return res.status(404).json({ message: "Role details not found" });
    }

    // 🛠 Prepare payload for FastAPI ML service
    const testData = {
      user_id: user._id.toString(),
      role: user.role,
      features: details.toObject(),
      activity_log: [
        { event: "login", timestamp: new Date().toISOString(), active: true },
      ],
      history_scores: details.history_scores || [],
    };

    const mlUrl = process.env.ML_SERVICE_URL || process.env.API_URL_PY || "http://localhost:5000";
    // ⚡ Call FastAPI
    const response = await fetch(`${mlUrl}/calculate-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ML Service Error:", errorText);
      return res.status(500).json({ message: "ML service failed", error: errorText });
    }

    const result = await response.json();
    console.log('the result is ',result)
    return res.json(result);

  } catch (error) {
    console.error("Error fetching score:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

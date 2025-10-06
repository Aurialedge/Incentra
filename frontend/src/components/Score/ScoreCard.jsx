import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ScoreCard.css";

// Helper function (frontend fallback)
const calculateLevelScore = (userData) => {
  if (!userData) return 0;

  const baseScore = (userData.rating || 0) * 20;

  const engagementBonus = Math.min(
    (userData.engagementMetrics?.loginStreak || 0) * 2 +
      (userData.engagementMetrics?.completedRides || 0) * 0.5,
    30
  );

  const penalty = Math.min(
    (userData.engagementMetrics?.cancellations || 0) * 3 +
      (userData.engagementMetrics?.complaints || 0) * 5,
    30
  );

  let finalScore = baseScore + engagementBonus - penalty;
  return Math.max(0, Math.min(100, Math.round(finalScore)));
};

// Tier calculation
const getTier = (score) => {
  if (score <= 200) return "Bronze";
  if (score <= 450) return "Amber";
  if (score <= 750) return "Ruby";
  return "Gold";
};

// Parse insights for better display
const parseInsights = (reasonLog) => {
  if (!reasonLog || typeof reasonLog !== 'string') {
    return {
      items: [],
      summary: "Your score is calculated based on your recent activity and performance metrics."
    };
  }

  const insights = [];
  
  // Extract gain
  const gainMatch = reasonLog.match(/([+-]?\d*\.?\d+)\s*gain/i);
  if (gainMatch) {
    const value = parseFloat(gainMatch[1]);
    insights.push({
      label: "Performance Gain",
      value: value > 0 ? `+${value}` : value.toString(),
      type: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
    });
  }

  // Extract penalty
  const penaltyMatch = reasonLog.match(/([+-]?\d*\.?\d+)\s*penalty/i);
  if (penaltyMatch) {
    const value = parseFloat(penaltyMatch[1]);
    insights.push({
      label: "Penalty Applied",
      value: value > 0 ? `-${Math.abs(value)}` : value < 0 ? `+${Math.abs(value)}` : '0',
      type: value > 0 ? 'negative' : value < 0 ? 'positive' : 'neutral'
    });
  }

  // Extract consistency
  const consistencyMatch = reasonLog.match(/([+-]?\d*\.?\d+)\s*consistency/i);
  if (consistencyMatch) {
    const value = parseFloat(consistencyMatch[1]);
    insights.push({
      label: "Consistency Bonus",
      value: value > 0 ? `+${value}` : value.toString(),
      type: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
    });
  }

  // Extract boost
  const boostMatch = reasonLog.match(/([+-]?\d*\.?\d+)\s*boost/i);
  if (boostMatch) {
    const value = parseFloat(boostMatch[1]);
    insights.push({
      label: "Special Boost",
      value: value > 0 ? `+${value}` : value.toString(),
      type: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
    });
  }

  // Extract model error
  const errorMatch = reasonLog.match(/([±+-]?\d*\.?\d+)\s*model\s*error/i);
  if (errorMatch) {
    const value = parseFloat(errorMatch[1].replace('±', ''));
    insights.push({
      label: "Model Variance",
      value: `±${value}`,
      type: 'neutral'
    });
  }

  // Generate summary based on insights
  let summary = "Your score is calculated based on ";
  const positiveItems = insights.filter(item => item.type === 'positive');
  const negativeItems = insights.filter(item => item.type === 'negative');
  
  if (positiveItems.length > 0 && negativeItems.length === 0) {
    summary += "your strong performance and consistent activity. Keep up the great work!";
  } else if (negativeItems.length > 0 && positiveItems.length === 0) {
    summary += "recent activity. Focus on improving consistency to boost your score.";
  } else if (positiveItems.length > 0 && negativeItems.length > 0) {
    summary += "your mixed performance. Continue your positive trends while addressing areas for improvement.";
  } else {
    summary += "your current activity level and engagement metrics.";
  }

  return { items: insights, summary };
};

const ScoreCard = ({ userId }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boost, setBoost] = useState(0);

  const fetchScore = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("logintoken");
      if (!token) throw new Error("No authentication token found. Please log in again.");

      const apiurl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      // 1️⃣ Fetch user profile
      const userResponse = await axios.get(`${apiurl}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (!userResponse.data?.user) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = userResponse.data.user;
      console.log("✅ User Data:", userData);

      setBoost(Math.round((userData.mlScores?.initialBoost || 0) * 100) / 100);

      // 2️⃣ Fetch role-specific details
      const detailsResponse = await axios.get(`${apiurl}/profile/details`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (!detailsResponse.data) {
        throw new Error("Failed to fetch user details");
      }

      const userDetails = detailsResponse.data;
      console.log("✅ User Details Data:", userDetails);

      // 3️⃣ Prepare payload for Python ML service
      const testData = {
        user_id: userData._id.toString(),
        role: userData.role || "merchant",
        features: userDetails,
        activity_log: [
          { event: "login", timestamp: new Date().toISOString(), active: true },
        ],
        history_scores: [78, 82, 80],
      };
      console.log(testData)
      
      const apiurlpy = import.meta.env.VITE_BACKEND_URL_PY || "http://localhost:5000";

      // 4️⃣ Call Python ML Service
      const Response = await axios.get(`${apiurl}/levelscore`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const result = Response.data;
      console.log("✅ ML Service Response:", result);
 
      // 5️⃣ Format final score data
      const finalScore = result?.final_score || calculateLevelScore(userData);
      const tier = getTier(finalScore);

      const formattedData = {
        tier,
        final_score: finalScore,
        consistency_bonus: result?.consistency_bonus || 0,
        penalty: result?.penalty || 0,
        boost: boost,
        spamScore: result?.spam_score || 0,
        lastCalculated: new Date().toISOString(),
        reason_log: result?.reason_log || "Your score is based on your recent activity and engagement.",
      };

      setScoreData(formattedData);
      
    } catch (err) {
      console.error("❌ Error in fetchScore:", err);
      setError(err.response?.data?.message || err.message || "Failed to load score data");

      if (err.response?.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchScore();
  }, [userId]);

const [creditscoredata,setCreditscoredata]=useState(0);
  const creditscore=async()=>{
    const apiurl=import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const token=localStorage.getItem("logintoken");
    const response=await axios.get(`${apiurl}/creditscore`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    const data = response.data;
    setCreditscoredata(data.data.final_score);
    console.log(data)
    console.log('credit score',data.data.final_score);
    return data;
  }
  useEffect(()=>{
    creditscore();
  },[])
  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const getTierColor = (tier) => {
    const tierMap = {
      bronze: "#cd7f32",
      silver: "#c0c0c0",
      gold: "#ffd700",
      platinum: "#e5e4e2",
      diamond: "#b9f2ff",
      amber: "#ffbf00",
      ruby: "#e0115f"
    };
    return tierMap[tier?.toLowerCase()] || "#666";
  };

  const renderInsights = () => {
    const { items, summary } = parseInsights(scoreData.reason_log);
    
    return (
      <div className="score-insights">
        <h3>Score Insights</h3>
        
        {items.length > 0 ? (
          <>
            <div className="insights-breakdown">
              {items.map((insight, index) => (
                <div key={index} className="insight-item">
                  
                  <div className="insight-label">
                    {insight.label}
                  </div>
                  -
                  <div className={`insight-value ${insight.type}`}>
                    {insight.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="insights-summary">
              <p>{summary}</p>
            </div>
          </>
        ) : (
          <p>{summary}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="score-loading">
        <div className="spinner"></div>
        <p>Loading your credit profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="score-error">
        <p>Error: {error}</p>
        <button onClick={fetchScore} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!scoreData) {
    return <div className="score-error">No score data available</div>;
  }

  const tierColor = getTierColor(scoreData.tier);
  const creditScore = scoreData.credit_score || 0;
  const levelScore = scoreData.final_score || 0;
  const spamScore = scoreData.spamScore || 0;
  const lastUpdated = formatDate(scoreData.lastCalculated);

  return (
    <div className="score-card">
      <div className="score-header">
        <h2>Your Credit Profile</h2>
        <span className="last-updated">Last updated: {lastUpdated}</span>
      </div>

      <div className="score-metrics">
        <div className="score-metric main-score">
          <span className="score-label">Credit Score</span>
          <div className="score-value" style={{ color: tierColor }}>
            {Math.round(creditscoredata)}
            <span className="score-max">/1000</span>
          </div>
          {scoreData.tier && (
            <div className="tier-badge" style={{ backgroundColor: tierColor }}>
              {scoreData.tier}
            </div>
          )}
        </div>

        <div className="score-stats">
          <div className="stat-item">
            <span className="stat-label">Level Score</span>
            <span className="stat-value">{Math.round(levelScore)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Spam Risk</span>
            <span className="stat-value">
              {Math.round(spamScore * 100)}%
              {spamScore > 0.3 && <span className="warning-icon">⚠️</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="score-details">
        <h3>Score Breakdown</h3>
        
        {scoreData.consistency_bonus > 0 && (
          <div className="detail-item">
            <span>Consistency Bonus</span>
            <span className="positive">+{Math.round(scoreData.consistency_bonus)}</span>
          </div>
        )}
        {scoreData.penalty > 0 && (
          <div className="detail-item">
            <span>Penalties</span>
            <span className="negative">-{Math.round(scoreData.penalty)}</span>
          </div>
        )}
        <div className="detail-item">
          <span>Boost</span>
          <span className="positive">+{boost}</span>
        </div>
      </div>

      {renderInsights()}
    </div>
  );
};

export default ScoreCard;
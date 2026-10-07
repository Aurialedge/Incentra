import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";   // ✅ Profile Icon
import './Profile.css';
import ScoreCard from "../Score/ScoreCard";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setdetails] = useState({});

  const apiurl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    const token = localStorage.getItem("logintoken");
    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiurl}/profile`, {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          alert(data.message || "Failed to load profile");
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        alert("Error fetching profile");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    const getdetails = async () => {
      try {
        const response = await fetch(`${apiurl}/profile/details`, {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
          console.log("Role details:", data);
          setdetails(data.data || {});
        }
      } catch (err) {
        console.error(err);
      }
    };

    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      setLoading(false);
    }

    fetchProfile();
    getdetails();
  }, [navigate, apiurl]);

  const handleLogout = async () => {
    try {
      await fetch(`${apiurl}/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("logintoken");
      localStorage.removeItem("user");
      navigate("/login");
    } catch {
      alert("Logout failed, try again.");
    }
  };

  if (loading) return <p>Loading...</p>;

  const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<span key={i} style={{ color: "gold", fontSize: "20px" }}>★</span>);
      } else if (i - rating < 1) {
        stars.push(<span key={i} style={{ color: "gold", fontSize: "20px" }}>☆</span>);
      } else {
        stars.push(<span key={i} style={{ color: "lightgray", fontSize: "20px" }}>☆</span>);
      }
    }
    return <div>{stars}</div>;
  };

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      {user ? (
        <div className="profile-content">
          {/* ✅ Profile Icon */}


          {/* Account Info */}
          <div className="profile-info">
            <div className="profile-avatar">
              <FaUserCircle size={100} color="#4A90E2" />
            </div>
            <h2>Account Information</h2>
            <div className="info-item"><span className="info-label">Name:</span> <span>{user.username}</span></div>
            <div className="info-item"><span className="info-label">Email:</span> <span>{user.email}</span></div>
            <div className="info-item"><span className="info-label">Role:</span> <span>{user.role}</span></div>
            <div className="info-item"><span className="info-label">Country:</span> <span>{user.country}</span></div>
            <div className="info-item"><span className="info-label">City:</span> <span>{user.city}</span></div>
            <div className="info-item"><span className="info-label">Grab ID:</span> <span>{user.grabId}</span></div>
            <div className="info-item"><span className="info-label">Age:</span> <span>{user.age}</span></div>

            <button onClick={handleLogout} className="logout-btn">Logout</button>

            {detail && Object.keys(detail).length > 0 && (
              <div className="profile-details">
                <h2>Role Details</h2>
                <div className="info-item">
                  <span className="info-label">Average Rating:</span>
                  <span className="info-value"><StarRating rating={detail.rating || 4.5} /></span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {user.role === 'merchant' ? 'Hours Operated:' : 'Hours Worked:'}
                  </span>
                  <span className="info-value">
                    {detail.total_hours_worked ?? detail.total_hours_operated ?? 0} hrs
                  </span>
                </div>
                {user.role === 'driver' && (
                  <div className="info-item">
                    <span className="info-label">30-Day Rides:</span>
                    <span className="info-value">{detail.rides_30d ?? 0}</span>
                  </div>
                )}
                {user.role === 'merchant' && (
                  <div className="info-item">
                    <span className="info-label">30-Day Sales:</span>
                    <span className="info-value">{detail.sales_30d ?? 0}</span>
                  </div>
                )}
                {user.role === 'delivery' && (
                  <div className="info-item">
                    <span className="info-label">30-Day Deliveries:</span>
                    <span className="info-value">{detail.deliveries_30d ?? 0}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Streak Days:</span>
                  <span className="info-value">{detail.streak_days ?? 0} days</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Age:</span>
                  <span className="info-value">{detail.account_age_days ?? 30} days</span>
                </div>
              </div>
            )}
          </div>

          {/* Score Section */}
          <div className="score-section">
            <ScoreCard userId={user._id} />
          </div>
        </div>
      ) : (
        <p>No user data</p>
      )}
    </div>
  );
};

export default Profile;

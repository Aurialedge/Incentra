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
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiurl}/profile`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
          console.log("Role details:", data);
          setdetails(data.data);
        }
      } catch (err) {
        console.error(err);
        alert("Error fetching details");
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

            {detail && (
              <div className="profile-details">
                <h2>Role Details</h2>
                <div className="info-item">
                  <span className="info-label">Average Rating:</span>
                  <span className="info-value"><StarRating rating={detail.rating} /></span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Hours Worked:</span>
                  <span className="info-value">{detail.total_hours_worked}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Streak Days:</span>
                  <span className="info-value">{detail.streak_days}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">{detail.account_age_days} days</span>
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

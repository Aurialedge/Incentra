import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const tokenlog=localStorage.getItem("logintoken") 
  
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  if (tokenlog){
    navigate("/profile")
  }
  // common states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [genre, setGenre] = useState("driver");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [grabid,setisgrab]=useState("")
  const apiurl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // login
  const handleLogin = async () => {
    try {
      const response = await fetch(`${apiurl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
  
      const data = await response.json();
      console.log("Login response:", data);
  
      // Adjust key depending on backend (token OR authToken OR jwt)
      const token = data.token || data.authToken || null;
  
      if (!token) {
        alert(data.message || "Login failed");
        return;
      }
  
      // Save token
      localStorage.setItem("logintoken", token);
  
      // 🔹 Now call daily login check right after storing token
      const dailyRes = await fetch(`${apiurl}/daily`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({}),
        credentials: "include"
      });
  
      const dailyData = await dailyRes.json();
      console.log("Daily response:", dailyData);
  
      if (dailyData.success) {
        navigate("/profile");
      } else {
        alert("Spam detected");
      }
  
    } catch (err) {
      console.error("Error during login:", err);
      alert("Something went wrong. Please try again.");
    }
  };
  
  // register
  const handleRegister = async () => {
    if (age < 18) {
      alert("Age must be at least 18");
      return;
    }
    const response = await fetch(`${apiurl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        email,
        role:genre,
        age,
        gender,
        country,
        city,
        grabid,
      }),
      credentials:"include"
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("logintoken", data.token);
      navigate("/profile");
    } else {
      alert(data.message || "Registration failed");
    }
  };

  // 📍 Detect location
  const detectLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();

          const detectedCity =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "";
          const detectedCountry = data.address.country || "";

          setCity(detectedCity);
          setCountry(detectedCountry);
        } catch (err) {
          console.error("Error fetching location:", err);
          alert("Unable to fetch location details");
        }
      });
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const [isgrabone, setIsgrabone] = useState(false);
  return (
    <div className="auth-container">
      {/* Left Panel - Grab Branding */}

      <div className="brand-panel">
        <div className="brand-content">
          <div className="brand-logo">Grab</div>
          <div className="brand-tagline">Your Everyday Everything</div>
          <div>
            Join millions of users who trust Grab for rides, deliveries, and more. Experience seamless transportation and services at your fingertips.
          </div>

          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">🚗</div>
              <div className="feature-text">Safe Rides</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🍔</div>
              <div className="feature-text">Food delovery</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <div className="feature-text">Package Delivery
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <div className="feature-text">Digital Payments
              </div>
            </div>
            {/* ...other features */}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="form-panel">
        <div className="form-card">
          {/* Toggle */}
          <div className="toggle-buttons">
            <button
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {/* Login form */}
          {isLogin ? (
            <>
              <h2>Welcome Back</h2>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleLogin}>Sign In</button>
            </>
          ) : (
            <>
              {/* Register form */}
              <h2>Create Account</h2>
              <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />



              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                  <option value="driver">Driver</option>
                  <option value="merchant">Merchant</option>
                  <option value="delivery">Delivery Partner</option>
                </select>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="previously" >
                <input
                  type="checkbox"
                  id="grabCheck"
                  style={{ width: "16px", height: "16px" }}
                  onClick={() => setIsgrabone(!isgrabone)}
                />
                <label htmlFor="grabCheck">Are you associated with Grab?</label> 
                <div className={`grabId ${isgrabone ? "block" : ""}`} >
                  <input type="text" placeholder="Enter your Grab ID" onChange={(e)=>setisgrab(e.target.value)}/>
                </div>
              </div>

              {/* 📍 Detect location button */}
              <button type="button" onClick={detectLocation}>
                Detect My Location
              </button>

              <button onClick={handleRegister}>Create Account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
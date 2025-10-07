import express from 'express'
import connect from './connections/connection.js'
import dotenv from 'dotenv'
import login from './Routes/login.js'
import register from './Routes/register.js'
import profile from './Routes/profile.js'
import logout from './Routes/logout.js'
import scores from './Routes/scores.js'
import level from './Routes/level.js'
import creditscore from './Routes/credit_score.js'
import daily from './Routes/daily.js'
import cors from 'cors'
import cookieParser from "cookie-parser";
const app = express();
app.use(cookieParser())
dotenv.config()
connect(process.env.MONGO_URI)
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ 
        status: "API is running",
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/login", login)
app.use("/register", register)
app.use("/profile", profile)
app.use("/logout", logout)
app.use("/api/scores", scores)
app.use("/levelscore", level)
app.use("/creditscore", creditscore)
app.use("/daily", daily)
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

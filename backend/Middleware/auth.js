import jwt from "jsonwebtoken"; 
import User from "../Models/user.model.js";
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
        const token = req.cookies?.logintoken || bearerToken;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userid = decoded.id;
        const user = await User.findOne({ _id: userid });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth verification error:", err.message);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};
export default verifyToken
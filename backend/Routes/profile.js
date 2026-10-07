import express from 'express' 
import User from '../Models/user.model.js'  
import jwt from 'jsonwebtoken' 
import Driver from '../Models/driver.model.js'
import Merchant from '../Models/merchant.model.js'
import Deliver from '../Models/deliver.model.js'
import verifyToken from '../Middleware/auth.js';
const router = express.Router(); 

router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ user });
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get('/details', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const userid = user._id;

        if (user.role === 'driver') {
            const userdetails = await Driver.findOne({ userId: userid });
            return res.json({ data: userdetails });
        } else if (user.role === 'merchant') {
            const userdetails = await Merchant.findOne({ userId: userid });
            return res.json({ data: userdetails });
        } else {
            const userdetails = await Deliver.findOne({ userId: userid });
            return res.json({ data: userdetails });
        }
    } catch (err) {
        console.error("Error fetching details:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router
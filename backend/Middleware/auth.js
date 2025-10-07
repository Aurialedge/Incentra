import jwt from "jsonwebtoken"; 
import User from "../Models/user.model.js";
const verifyToken=async (req,res,next)=>{
    const token=req.cookies.logintoken 
    if (!token){
        return res.status(401).json({message:"Unauthorized"})
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userid=decoded.id
    console.log('userid is ',userid)
    const user=await User.findOne({_id:userid})
    req.user=user
    next()
}
export default verifyToken
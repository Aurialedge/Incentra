import express from 'express'
const router=express.Router()
import User from '../Models/user.model.js'
import jwt from 'jsonwebtoken'
router.post("/", async (req, res) => {
    console.log('in login',req.body)
    const { email, password } = req.body;
    const user=await User.findOne({email:email}) 
    if (!user){
        res.status(404).json({message:
            "User not found"
        })
        return
    }
    const passwordfromdb=user.password
    console.log(passwordfromdb,password)
    if (passwordfromdb !== password){
        console.log("Invalid password")
        res.status(401).json({message:
            "Invalid password"
        })
        return
    }
    const secretkey=process.env.SECRET_KEY
    const token=jwt.sign({id:user._id},secretkey)
    res.cookie('logintoken',token,{
            httpOnly:true,
            secure:false,
            sameSite:'strict',
            maxAge:120*60*60*1000
        })
    res.status(200).json({message:"token found " , token:token})
    
});
export default router

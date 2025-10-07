import express from 'express' 
import User from '../Models/user.model.js'  
import jwt from 'jsonwebtoken' 
import Driver from '../Models/driver.model.js'
import Merchant from '../Models/merchant.model.js'
import Deliver from '../Models/deliver.model.js'
const router=express.Router() 

router.get('/',async (req,res)=>{
    const token=req.cookies.logintoken 
    if (!token){
        return res.status(401).json({message:"Unauthorized"})
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userid=decoded.id
    const user=await User.findOne({_id:userid})
    console.log(user)
    res.status(200).json({user})
})
router.get('/details',async (req,res)=>{
    console.log('in details')
    const token=req.cookies.logintoken 
    if (!token){
        return res.json(401).json({message:"Unauthorized"})
    }
    const decoded=jwt.verify(token,process.env.SECRET_KEY) 
    const userid=decoded.id 
    const user=await User.findOne({_id:userid})
    if (!user){
        return res.json(404).json({message:"User not found"})
    }
    console.log(user.role,user._id)
    if (user.role==='driver'){
        const userdetails=await Driver.findOne({userId:userid})
        console.log(userdetails)
        return res.json({data:userdetails})
    }
    else if (user.role==='merchant'){
        const userdetails=await Merchant.findOne({userId:userid})
        console.log(userdetails)
        return res.json({data:userdetails})
    }
    else{
        const userdetails=await Deliver.findOne({userId:userid})
        console.log(userdetails)
        return res.json({data:userdetails})
    }
})

export default router
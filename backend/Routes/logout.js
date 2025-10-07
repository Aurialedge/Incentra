import express from 'express'
const router=express.Router() 

router.post('/',async (req,res)=>{
    res.clearCookie('logintoken')
    res.status(200).json({response:true,message:"User logged out successfully"})

})

export default router

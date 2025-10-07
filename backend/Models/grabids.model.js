import mongoose from "mongoose";
const grabidchema=new mongoose.Schema({
    GrabID:{type:Number,required:true,unique:true},
    SocialEngagement:{type:Number,required:true},
    FinancialEngagement:{type:Number,required:true},
    GigWorkerEngagement:{type:Number,required:true},
    JobEngagement:{type:Number,required:true}
})
const grabidmodel=mongoose.model("GrabId",grabidchema)
export default grabidmodel

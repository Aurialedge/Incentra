import { ObjectId } from 'mongodb';
const company_preferences = {
    _id: new ObjectId('68bb3374933031ff69323993'),
    GrabID: 24,
    SocialEngagement: 10,
    FinancialEngagement: 60,
    GigWorkerEngagement: 70,
    JobEngagement: 60
  }
const maxinitalboost=20 
const mininitialboost=5
let sum=0
let arr=[]
console.log(company_preferences)
for (let i of Object.values(company_preferences)){
    sum+=i 
    console.log(i)
}
let s,f,g,j;
s=company_preferences.SocialEngagement
f=company_preferences.FinancialEngagement 
g=company_preferences.GigWorkerEngagement
j=company_preferences.JobEngagement
let weightnum=s+f+g+j
console.log(weightnum)
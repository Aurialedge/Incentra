import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Basic Information
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["driver", "merchant", "delivery"], 
        required: true 
    },
    
    // Personal Information
    age: { type: Number, required: true },
    gender: { 
        type: String, 
        enum: ["male", "female", "other"], 
        required: true 
    },
    country: { type: String, required: true },
    city: { type: String, required: true },
    
    // Rating and Reputation
    rating: { type: Number, default: 0 },
    ratingsArray: { type: [Number], default: [] },
    
    // ML and Scoring
    mlScores: {
        levelScore: { type: Number, default: 0 },
        creditScore: { type: Number, default: 0 },
        spamScore: { type: Number, default: 0 },
        lastCalculated: { type: Date },
        initialBoost: { type: Number, default: 0 },
        tier: { type: String, enum: ["Bronze", "Amber", "Ruby", "Gold"], default: "Bronze" },
    },
    
    // Activity Tracking
    activityLog: [{
        date: { type: Date, default: Date.now },
        active: { type: Boolean, default: false },
        metrics: { type: Map, of: mongoose.Schema.Types.Mixed }
    }],
    
    // Engagement Metrics
    engagementMetrics: {
        loginRate: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        responseTime: { type: Number, default: 0 },
    },
    
    // Platform Specific
    grabId: { type: Number, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
    last_checkin: { type: Date },
    loginstreak: { type: Array, default: [] },
}, { timestamps: true });

// Indexes for faster queries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'mlScores.tier': 1 });
userSchema.index({ 'mlScores.levelScore': -1 });
userSchema.index({ role: 1, 'mlScores.levelScore': -1 });

// Pre-save hook to update derived fields
userSchema.pre('save', function(next) {
    // Update average rating if ratings array changes
    if (this.isModified('ratingsArray') && this.ratingsArray.length > 0) {
        this.rating = this.ratingsArray.reduce((a, b) => a + b, 0) / this.ratingsArray.length;
    }
    
    // Update tier based on level score
    if (this.isModified('mlScores.levelScore')) {
        const score = this.mlScores.levelScore;
        if (score >= 750) this.mlScores.tier = "Gold";
        else if (score >= 500) this.mlScores.tier = "Ruby";
        else if (score >= 250) this.mlScores.tier = "Amber";
        else this.mlScores.tier = "Bronze";
        
        this.mlScores.lastCalculated = new Date();
    }
    
    next();
});

const User = mongoose.model('User', userSchema);
export default User;

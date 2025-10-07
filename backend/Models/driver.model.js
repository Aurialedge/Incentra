// Models/driver.model.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,unique:true },
  role:{type:String,default:"driver"},
  // Engagement / performance features
  login_rate: { type: Number, default: 0 },
  streak_days: { type: Number, default: 0 },
  rides_30d: { type: Number, default: 0 },
  on_time_rate: { type: Number, default: 0 },
  cancellation_rate: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  avg_ride_distance: { type: Number, default: 0 },
  peak_hour_rides: { type: Number, default: 0 },
  late_pickup_rate: { type: Number, default: 0 },
  customer_complaints: { type: Number, default: 0 },
  ratings_std: { type: Number, default: 0 },
  total_hours_worked: { type: Number, default: 0 },

  // Supporting ML features
  activity_log: [
    { 
      event: { type: String },
      timestamp: { type: Date, default: Date.now },
      active: { type: Boolean, default: true }
    }
  ],
  history_scores: { type: [Number], default: [] },

  // Spam-related features (if needed for hybrid model)
  review_count: { type: Number, default: 0 },
  rating_variance: { type: Number, default: 0 },
  avg_review_length: { type: Number, default: 0 },
  logins_per_day: { type: Number, default: 0 },
  std_login_time: { type: Number, default: 0 },
  account_age_days: { type: Number, default: 0 }
});

// Middleware to update updated_at on save
driverSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model("Driver", driverSchema);

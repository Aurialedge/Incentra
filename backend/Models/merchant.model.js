// Models/merchant.model.js
import mongoose from 'mongoose';

const MerchantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'User'
  },
  role: {
    type: String,
    default: 'merchant'
  },

  login_rate: { type: Number, default: 0 },            // 0.0 - 1.0
  streak_days: { type: Number, default: 0 },           // days
  sales_30d: { type: Number, default: 0 },             // sales in last 30 days
  order_fulfillment_rate: { type: Number, default: 0 },// 0.0 - 1.0
  return_rate: { type: Number, default: 0 },           // 0.0 - 1.0
  rating: { type: Number, default: 0 },                // 0 - 5
  avg_order_value: { type: Number, default: 0 },       // $
  peak_hour_sales: { type: Number, default: 0 },
  complaints_received: { type: Number, default: 0 },
  new_customers_acquired: { type: Number, default: 0 },
  repeat_customer_rate: { type: Number, default: 0 },  // 0.0 - 1.0
  total_hours_operated: { type: Number, default: 0 },

  activity_log: [
    {
      event: { type: String },
      timestamp: { type: Date, default: Date.now },
      active: { type: Boolean, default: true }
    }
  ],
  history_scores: { type: [Number], default: [] }, // previous monthly scores
  review_count: { type: Number, default: 0 },
  rating_variance: { type: Number, default: 0 },
  avg_review_length: { type: Number, default: 0 },
  logins_per_day: { type: Number, default: 0 },
  std_login_time: { type: Number, default: 0 },
  account_age_days: { type: Number, default: 0 }
});

// Middleware to update updated_at on save
MerchantSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const MerchantModel = mongoose.model('Merchant', MerchantSchema);
export default MerchantModel;

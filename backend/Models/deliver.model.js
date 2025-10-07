import mongoose from 'mongoose';

const deliverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true, // each driver corresponds to one user
    ref: 'User'
  },
  role: {
    type: String,
    default: 'delivery'
  },
    login_rate: { type: Number, default: 0 },
    streak_days: { type: Number, default: 0 },
    deliveries_30d: { type: Number, default: 0 },
    on_time_delivery_rate: { type: Number, default: 0 },
    cancellation_rate: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    avg_delivery_distance: { type: Number, default: 0 },
    peak_hour_deliveries: { type: Number, default: 0 },
    late_delivery_rate: { type: Number, default: 0 },
    customer_complaints: { type: Number, default: 0 },
    ratings_std: { type: Number, default: 0 },
    total_hours_worked: { type: Number, default: 0 } ,
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
deliverSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const Deliver = mongoose.model('Deliver', deliverSchema);

export default Deliver;

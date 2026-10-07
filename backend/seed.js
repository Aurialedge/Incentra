import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './Models/user.model.js';
import Driver from './Models/driver.model.js';
import Merchant from './Models/merchant.model.js';
import Deliver from './Models/deliver.model.js';
import GrabId from './Models/grabids.model.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grab';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    // 1. Seed GrabIDs
    const existingGrab = await GrabId.findOne({ GrabID: 24 });
    if (!existingGrab) {
      const grabData = [
        { GrabID: 1, SocialEngagement: 70, FinancialEngagement: 80, GigWorkerEngagement: 50, JobEngagement: 90 },
        { GrabID: 2, SocialEngagement: 50, FinancialEngagement: 60, GigWorkerEngagement: 40, JobEngagement: 70 },
        { GrabID: 3, SocialEngagement: 85, FinancialEngagement: 90, GigWorkerEngagement: 80, JobEngagement: 95 },
        { GrabID: 24, SocialEngagement: 60, FinancialEngagement: 80, GigWorkerEngagement: 70, JobEngagement: 75 },
        { GrabID: 101, SocialEngagement: 40, FinancialEngagement: 50, GigWorkerEngagement: 60, JobEngagement: 45 }
      ];
      await GrabId.deleteMany({});
      await GrabId.insertMany(grabData);
      console.log('✅ Seeded GrabIDs');
    }

    // 2. Seed Demo Driver
    let driverUser = await User.findOne({ email: 'driver@incentra.com' });
    if (!driverUser) {
      driverUser = new User({
        username: 'john_driver',
        email: 'driver@incentra.com',
        password: 'password123',
        role: 'driver',
        age: 29,
        gender: 'male',
        country: 'India',
        city: 'Bangalore',
        grabId: 24,
        rating: 4.8,
        mlScores: {
          levelScore: 780,
          creditScore: 820,
          spamScore: 0.05,
          initialBoost: 16.5,
          tier: 'Gold',
          lastCalculated: new Date()
        },
        engagementMetrics: {
          loginRate: 0.95,
          streakDays: 45,
          completionRate: 0.98,
          responseTime: 2
        }
      });
      await driverUser.save();

      const driverProfile = new Driver({
        userId: driverUser._id,
        role: 'driver',
        login_rate: 0.95,
        streak_days: 45,
        rides_30d: 140,
        on_time_rate: 0.96,
        cancellation_rate: 0.03,
        rating: 4.8,
        avg_ride_distance: 14.2,
        peak_hour_rides: 42,
        late_pickup_rate: 0.04,
        customer_complaints: 1,
        ratings_std: 0.15,
        total_hours_worked: 180,
        review_count: 65,
        rating_variance: 0.08,
        avg_review_length: 110,
        logins_per_day: 1.8,
        std_login_time: 0.4,
        account_age_days: 420,
        activity_log: Array.from({ length: 30 }, (_, i) => ({
          event: 'ride_completed',
          timestamp: new Date(Date.now() - (29 - i) * 86400000),
          active: true
        })),
        history_scores: [720, 750, 780]
      });
      await driverProfile.save();
      console.log('✅ Seeded Demo Driver: driver@incentra.com / password123');
    }

    // 2b. Seed Demo Ruby Driver
    let rubyDriverUser = await User.findOne({ email: 'ruby_driver@incentra.com' });
    if (!rubyDriverUser) {
      rubyDriverUser = new User({
        username: 'raj_ruby_driver',
        email: 'ruby_driver@incentra.com',
        password: 'password123',
        role: 'driver',
        age: 31,
        gender: 'male',
        country: 'India',
        city: 'Bangalore',
        grabId: 2,
        rating: 4.6,
        mlScores: {
          levelScore: 650,
          creditScore: 710,
          spamScore: 0.04,
          initialBoost: 12.0,
          tier: 'Ruby',
          lastCalculated: new Date()
        },
        engagementMetrics: {
          loginRate: 0.85,
          streakDays: 24,
          completionRate: 0.94,
          responseTime: 4
        }
      });
      await rubyDriverUser.save();

      const rubyDriverProfile = new Driver({
        userId: rubyDriverUser._id,
        role: 'driver',
        login_rate: 0.85,
        streak_days: 24,
        rides_30d: 95,
        on_time_rate: 0.93,
        cancellation_rate: 0.05,
        rating: 4.6,
        avg_ride_distance: 12.0,
        peak_hour_rides: 28,
        late_pickup_rate: 0.07,
        customer_complaints: 1,
        ratings_std: 0.20,
        total_hours_worked: 140,
        review_count: 42,
        rating_variance: 0.12,
        avg_review_length: 90,
        logins_per_day: 1.4,
        std_login_time: 0.6,
        account_age_days: 280,
        activity_log: Array.from({ length: 30 }, (_, i) => ({
          event: 'ride_completed',
          timestamp: new Date(Date.now() - (29 - i) * 86400000),
          active: i % 10 !== 0
        })),
        history_scores: [580, 600, 620]
      });
      await rubyDriverProfile.save();
      console.log('✅ Seeded Demo Ruby Driver: ruby_driver@incentra.com / password123');
    }

    // 2c. Seed Demo Amber Driver
    let amberDriverUser = await User.findOne({ email: 'amber_driver@incentra.com' });
    if (!amberDriverUser) {
      amberDriverUser = new User({
        username: 'amit_amber_driver',
        email: 'amber_driver@incentra.com',
        password: 'password123',
        role: 'driver',
        age: 26,
        gender: 'male',
        country: 'India',
        city: 'Bangalore',
        grabId: 101,
        rating: 4.2,
        mlScores: {
          levelScore: 350,
          creditScore: 580,
          spamScore: 0.08,
          initialBoost: 8.0,
          tier: 'Amber',
          lastCalculated: new Date()
        },
        engagementMetrics: {
          loginRate: 0.65,
          streakDays: 8,
          completionRate: 0.88,
          responseTime: 7
        }
      });
      await amberDriverUser.save();

      const amberDriverProfile = new Driver({
        userId: amberDriverUser._id,
        role: 'driver',
        login_rate: 0.65,
        streak_days: 8,
        rides_30d: 55,
        on_time_rate: 0.86,
        cancellation_rate: 0.09,
        rating: 4.2,
        avg_ride_distance: 9.5,
        peak_hour_rides: 14,
        late_pickup_rate: 0.14,
        customer_complaints: 3,
        ratings_std: 0.35,
        total_hours_worked: 80,
        review_count: 22,
        rating_variance: 0.22,
        avg_review_length: 75,
        logins_per_day: 1.1,
        std_login_time: 1.1,
        account_age_days: 120,
        activity_log: Array.from({ length: 30 }, (_, i) => ({
          event: 'ride_completed',
          timestamp: new Date(Date.now() - (29 - i) * 86400000),
          active: i % 4 !== 0
        })),
        history_scores: [340, 360, 380]
      });
      await amberDriverProfile.save();
      console.log('✅ Seeded Demo Amber Driver: amber_driver@incentra.com / password123');
    }

    // 2d. Seed Demo Bronze Driver
    let bronzeDriverUser = await User.findOne({ email: 'bronze_driver@incentra.com' });
    if (!bronzeDriverUser) {
      bronzeDriverUser = new User({
        username: 'vikram_bronze_driver',
        email: 'bronze_driver@incentra.com',
        password: 'password123',
        role: 'driver',
        age: 38,
        gender: 'male',
        country: 'India',
        city: 'Bangalore',
        grabId: null,
        rating: 3.8,
        mlScores: {
          levelScore: 120,
          creditScore: 420,
          spamScore: 0.15,
          initialBoost: 0,
          tier: 'Bronze',
          lastCalculated: new Date()
        },
        engagementMetrics: {
          loginRate: 0.35,
          streakDays: 1,
          completionRate: 0.72,
          responseTime: 15
        }
      });
      await bronzeDriverUser.save();

      const bronzeDriverProfile = new Driver({
        userId: bronzeDriverUser._id,
        role: 'driver',
        login_rate: 0.35,
        streak_days: 1,
        rides_30d: 15,
        on_time_rate: 0.70,
        cancellation_rate: 0.20,
        rating: 3.8,
        avg_ride_distance: 6.0,
        peak_hour_rides: 4,
        late_pickup_rate: 0.30,
        customer_complaints: 6,
        ratings_std: 0.55,
        total_hours_worked: 30,
        review_count: 8,
        rating_variance: 0.40,
        avg_review_length: 50,
        logins_per_day: 0.6,
        std_login_time: 1.8,
        account_age_days: 45,
        activity_log: Array.from({ length: 30 }, (_, i) => ({
          event: 'ride_completed',
          timestamp: new Date(Date.now() - (29 - i) * 86400000),
          active: i % 3 === 0
        })),
        history_scores: [120, 140, 150]
      });
      await bronzeDriverProfile.save();
      console.log('✅ Seeded Demo Bronze Driver: bronze_driver@incentra.com / password123');
    }

    // 3. Seed Demo Merchant
    let merchantUser = await User.findOne({ email: 'merchant@incentra.com' });
    if (!merchantUser) {
      merchantUser = new User({
        username: 'sarah_merchant',
        email: 'merchant@incentra.com',
        password: 'password123',
        role: 'merchant',
        age: 34,
        gender: 'female',
        country: 'India',
        city: 'Mumbai',
        grabId: 3,
        rating: 4.7,
        mlScores: {
          levelScore: 810,
          creditScore: 840,
          spamScore: 0.02,
          initialBoost: 18.0,
          tier: 'Gold',
          lastCalculated: new Date()
        },
        engagementMetrics: {
          loginRate: 0.98,
          streakDays: 52,
          completionRate: 0.99,
          responseTime: 1
        }
      });
      await merchantUser.save();

      const merchantProfile = new Merchant({
        userId: merchantUser._id,
        role: 'merchant',
        login_rate: 0.98,
        streak_days: 52,
        sales_30d: 280,
        order_fulfillment_rate: 0.97,
        return_rate: 0.02,
        rating: 4.7,
        avg_order_value: 450,
        peak_hour_sales: 38,
        complaints_received: 2,
        new_customers_acquired: 45,
        repeat_customer_rate: 0.88,
        total_hours_operated: 260,
        review_count: 92,
        rating_variance: 0.05,
        avg_review_length: 130,
        logins_per_day: 2.1,
        std_login_time: 0.2,
        account_age_days: 500,
        activity_log: Array.from({ length: 30 }, (_, i) => ({
          event: 'sale_processed',
          timestamp: new Date(Date.now() - (29 - i) * 86400000),
          active: true
        })),
        history_scores: [760, 790, 810]
      });
      await merchantProfile.save();
      console.log('✅ Seeded Demo Merchant: merchant@incentra.com / password123');
    }

    // 4. Seed Demo Delivery Partner
    let deliveryUser = await User.findOne({ email: 'delivery@incentra.com' });
    if (!deliveryUser) {
      deliveryUser = new User({
        username: 'alex_delivery',
        email: 'delivery@incentra.com',
        password: 'password123',
        role: 'delivery',
        age: 25,
        gender: 'male',
        country: 'India',
        city: 'Delhi',
        grabId: 1,
        rating: 4.6,
        mlScores: {
          levelScore: 740,
          creditScore: 760,
          spamScore: 0.04,
          initialBoost: 15.0,
          tier: 'Ruby',
          lastCalculated: new Date()
        },
        engagementMetrics: {
          loginRate: 0.92,
          streakDays: 38,
          completionRate: 0.96,
          responseTime: 3
        }
      });
      await deliveryUser.save();

      const deliveryProfile = new Deliver({
        userId: deliveryUser._id,
        role: 'delivery',
        login_rate: 0.92,
        streak_days: 38,
        deliveries_30d: 160,
        on_time_delivery_rate: 0.95,
        cancellation_rate: 0.02,
        rating: 4.6,
        avg_delivery_distance: 6.5,
        peak_hour_deliveries: 45,
        late_delivery_rate: 0.05,
        customer_complaints: 1,
        ratings_std: 0.18,
        total_hours_worked: 190,
        review_count: 58,
        rating_variance: 0.09,
        avg_review_length: 95,
        logins_per_day: 1.5,
        std_login_time: 0.5,
        account_age_days: 350,
        activity_log: Array.from({ length: 30 }, (_, i) => ({
          event: 'delivery_completed',
          timestamp: new Date(Date.now() - (29 - i) * 86400000),
          active: true
        })),
        history_scores: [680, 710, 740]
      });
      await deliveryProfile.save();
      console.log('✅ Seeded Demo Delivery Partner: delivery@incentra.com / password123');
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();

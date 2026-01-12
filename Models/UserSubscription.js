// Models/UserSubscription.js
import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },

    transactionId: {
      type: String,
      required: true,
      unique: true, // 🔐 prevents duplicate orders
    },

    startDate: Date,
    endDate: Date,

    productsLimit: Number,
    productsCreated: { type: Number, default: 0 },

    hasUsedFreePlan: { type: Boolean, default: false },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("UserSubscription", userSubscriptionSchema);

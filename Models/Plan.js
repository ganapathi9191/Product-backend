import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    productLimit: Number,
    durationInDays: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);

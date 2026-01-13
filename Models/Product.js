// ==========================================
// Models/Product.js
// ==========================================
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
   
    images: [
      {
        type: String,
        required: true,
      },
    ],
    features: [
      {
        name: String,
        image: String,
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
        // ================= CONTACT DETAILS =================
    contactDetails: {
      name: { type: String },
      mobile: { type: String },
      email: { type: String },
    },

    // ================= BUSINESS / PROPERTY LOCATION =================
    businessLocation: {
      type: String,
    },

    // ================= OPENING HOURS =================
    openingHours: {
      openTime: { type: String },   // "09:00 AM"
      closeTime: { type: String },  // "09:00 PM"
      days: [{ type: String }],     // ["Mon", "Tue", "Wed"]
    },

    // ================= RENT / PROPERTY FIELDS =================
    houseRent: {
      rentAmount: { type: Number },
      details: { type: String },
    },

    villaRent: {
      rentAmount: { type: Number },
      details: { type: String },
    },

    // ================= SHOP & BUSINESS SERVICES =================
    shopServices: [
      {
        type: String, // "Mobile Repair", "Tailoring"
      },
    ],

    businessServices: [
      {
        type: String, // "Consulting", "Digital Marketing"
      },
    ],

    // ================= LAND DETAILS =================
    landDetails: {
      amount: { type: Number },
      details: { type: String },
    },

    // ================= RESTAURANT SERVICES =================
    restaurantServices: [
      {
        type: String, // "Dine In", "Take Away", "Delivery"
      },
    ],

  },
  { timestamps: true }
);

productSchema.index({ location: "2dsphere" });

export default mongoose.model("Product", productSchema);
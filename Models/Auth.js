import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    email: String,
    profileImage: String,

    // ✅ OPTIONAL GEO LOCATION
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    role: {
      type: String,
      default: "user", // ❌ NO ENUM (as you requested)
    },

    isActive: {
      type: Boolean,
      default: true,
    },
       // ✅ Account deletion fields
    deleteToken: {
      type: String,
      default: null,
    },
    deleteTokenExpiration: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Only index when coordinates exist
userSchema.index(
  { location: "2dsphere" },
  { sparse: true }
);

export default mongoose.model("User", userSchema);

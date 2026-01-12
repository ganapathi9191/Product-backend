import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Ensure env is loaded
dotenv.config();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Debug logging
console.log("☁️ Cloudinary Configuration:");
console.log("  Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "❌ MISSING");
console.log("  API Key:", process.env.CLOUDINARY_API_KEY || "❌ MISSING");
console.log("  API Secret:", process.env.CLOUDINARY_API_SECRET ? "✅ Present" : "❌ MISSING");

// Verify config is set
const config = cloudinary.config();
console.log("  Config loaded:", config.cloud_name ? "✅" : "❌");

export default cloudinary;
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./Routes/authRoutes.js";
import productRoutes from "./Routes/productRoutes.js";
import adminRoutes from "./Routes/adminRoutes.js";

import { createDefaultAdmin } from "./Controllers/adminAuthController.js";

dotenv.config();

const app = express();

// =======================
// MIDDLEWARES
// =======================
app.use(cors());
app.use(express.json());

app.use(cors({
  origin: "https://productdeleteurl.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true // agar cookies/auth headers use kar rahe ho
}));

// =======================
// MONGODB CONNECTION
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // 🔥 CREATE DEFAULT ADMIN (ONE TIME)
    await createDefaultAdmin();
  })
  .catch((err) => console.error("❌ Mongo Error:", err));

// =======================
// ROUTES
// =======================
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/admin", adminRoutes);

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server running 🚀",
  });
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

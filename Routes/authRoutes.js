import express from "express";
import upload from "../utils/upload.js";
import authMiddleware from "../utils/authMiddleware.js";

import {
  sendOtp,
  verifyOtp,
  resendOtp,
  updateProfile,
  updateLiveLocation,
  getProfileById,
  getAllUsers,

  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,

  createSubCategory,
  getAllSubCategories,
  getSubCategoriesByCategory,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,

  createPlan,
  getAllPlans,
  getAllPlansbyuser,
  getPlanById,
  updatePlan,
  deletePlan,
  
  getUserActiveSubscription,
  getUserSubscriptionHistory,
  createPlanOrder,
  verifyPlanPayment,
  deleteUserAccount,
  deleteAccount,
  confirmDeleteAccount,
} from "../Controllers/authController.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

/* ================= PROFILE ================= */
/* ✅ ONLY HERE AUTH MIDDLEWARE IS USED */
router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile
);

/* ❌ NO AUTH HERE */
router.put("/update-location/:userId", updateLiveLocation);
router.get("/profile/:id", getProfileById);
router.get("/users", getAllUsers);

/* ================= CATEGORY ================= */
router.post("/category/create", createCategory);
router.get("/getall-categories", getCategories);
router.get("/get-category/:id", getCategoryById);
router.put("/category/:id", updateCategory);
router.delete("/category/:id", deleteCategory);

/* ================= SUB CATEGORY ================= */
router.post(
  "/sub/create",
  upload.single("image"),
  createSubCategory
);

router.get("/sub/all", getAllSubCategories);
router.get("/sub/:id", getSubCategoryById);
router.get(
  "/sub/category/:categoryId",
  getSubCategoriesByCategory
);

router.put(
  "/sub/:id",
  upload.single("image"),
  updateSubCategory
);

router.delete("/sub/:id", deleteSubCategory);

/* ================= PLANS ================= */
router.post("/plan", createPlan);
router.get("/plans", getAllPlans);
router.get("/plans/userid", getAllPlansbyuser);
router.get("/plan/:id", getPlanById);
router.put("/plan/:id", updatePlan);
router.delete("/plan/:id", deletePlan);

/* ================= SUBSCRIPTIONS ================= */
router.get("/subscription/active/:userId", getUserActiveSubscription);
router.get("/subscription/history/:userId", getUserSubscriptionHistory);

router.post("/create-order", createPlanOrder);
router.post("/verify-payment", verifyPlanPayment);


router.delete('/deletemyaccount/:userId', deleteUserAccount);

router.post('/deleteaccount', deleteAccount)
router.get('/confirm-delete-account/:token', confirmDeleteAccount);

export default router;

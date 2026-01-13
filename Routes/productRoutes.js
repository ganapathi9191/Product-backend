import express from "express";
import upload from "../utils/upload.js";

import {
  createProduct,
  getAllProducts,

  approveProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getNearestProductsByUser,
  toggleWishlist,
  getWishlist,
  getUserProducts,
  searchProducts,
  filterProducts,
  getAdminApprovedProducts,
  getAdminPendingProducts,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../Controllers/productController.js";

const router = express.Router();

/* ================= PRODUCT ================= */
router.post(
  "/create/:subCategoryId",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "featureImages", maxCount: 10 },
  ]),
  createProduct
);

router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "featureImages", maxCount: 10 },
  ]),
  updateProduct
);

router.get("/getallProducts", getAllProducts);
//router.get("/pending", getPendingProducts);
router.get("/getProduct/:id", getProductById);
router.get("/user/:userId", getUserProducts);
router.get("/nearest/user/:userId", getNearestProductsByUser);

router.post("/approve", approveProduct);
router.delete("/:id", deleteProduct);

/* ================= WISHLIST ================= */
router.post("/wishlist/toggle", toggleWishlist);
router.get("/wishlist/:userId", getWishlist);


// SEARCH & FILTER
router.get("/products/search", searchProducts);
router.get("/products/filter", filterProducts);

router.get("/products/approved", getAdminApprovedProducts);
router.get("/products/pending", getAdminPendingProducts);

router.get("/notifications/:userId", getUserNotifications);
router.put("/notifications/read/:notificationId", markNotificationAsRead);
router.delete("/notifications/:notificationId", deleteNotification);

export default router;

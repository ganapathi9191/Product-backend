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

export default router;

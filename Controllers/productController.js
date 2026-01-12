// ============================================
// Controllers/productController.js
// ============================================

import Product from "../Models/Product.js";
import User from "../Models/Auth.js";
import SubCategory from "../Models/SubCategory.js";

import { uploadMultipleToCloudinary } from "../utils/upload.js";



// ============================================
// CREATE PRODUCT
// ============================================
export const createProduct = async (req, res) => {
  try {
    const { subCategoryId } = req.params; // ✅ moved to params

    const {
      userId,
      name,
      type,
      address,
      description,
      latitude,
      longitude,
    } = req.body;

    // Upload images
    const images = await uploadMultipleToCloudinary(
      req.files?.images,
      "products"
    );

    const product = await Product.create({
      user: userId,
      subCategory: subCategoryId, // ✅ from params
      name,
      type,
      images,
      location: {
        type: "Point",
        coordinates: [longitude, latitude], // [lng, lat]
      },
      address,
      description,
      isApproved: false, // 🔴 always admin approval
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product submitted for admin approval",
      product,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Product creation failed",
    });
  }
};




// ============================================
// GET ALL PRODUCTS
// ============================================
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isApproved: true,
      isActive: true,
    })
      .populate("subCategory", "name")
      .populate("user", "name email mobile")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};






// APPROVE PRODUCT
export const approveProduct = async (req, res) => {
  try {
    const { productId, adminId, status, rejectionReason } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ✅ APPROVE
    if (status === "approved") {
      product.isApproved = true;
      product.approvedBy = adminId;
      product.approvedAt = new Date();
      await product.save();

      return res.json({
        success: true,
        message: "Product approved",
        product,
      });
    }

    // ❌ REJECT → DELETE PRODUCT
    if (status === "rejected") {
      await Product.findByIdAndDelete(productId);

      return res.json({
        success: true,
        message: "Product rejected and deleted",
        reason: rejectionReason || "Rejected by admin",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Approval failed" });
  }
};
 

// GET SINGLE PRODUCT
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isApproved: true,
      isActive: true,
    })
      .select("-type")
      .populate("subCategory", "name")
      .populate("user", "name email mobile profileImage");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not approved",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};
 

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      description,
      latitude,
      longitude,
      featureNames,
    } = req.body;

    const updateData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(address && { address }),
      ...(description && { description }),
      ...(latitude && longitude && {
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      }),
    };

    const imageFiles = req.files?.filter(f => f.fieldname === "images");
    if (imageFiles && imageFiles.length > 0) {
      const images = await uploadMultipleToCloudinary(imageFiles, "products");
      updateData.images = images;
    }

    if (featureNames) {
      const featureImageFiles = req.files?.filter(f => f.fieldname === "featureImages");
      if (featureImageFiles && featureImageFiles.length > 0) {
        const names = JSON.parse(featureNames);
        const featureImages = await uploadMultipleToCloudinary(
          featureImageFiles,
          "product_features"
        );

        updateData.features = names.map((name, i) => ({
          name,
          image: featureImages[i],
        }));
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// GET NEAREST PRODUCTS
export const getNearestProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxDistance = 5000 } = req.query;

    const user = await User.findById(userId);

    if (!user || !user.location?.coordinates?.length) {
      return res.status(404).json({
        success: false,
        message: "User location not found",
      });
    }

    const [longitude, latitude] = user.location.coordinates;

    const products = await Product.find({
      isApproved: true,
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: Number(maxDistance),
        },
      },
    })
      .select("-description -type")
      .populate("subCategory", "name")
      .populate("user", "name mobile");

    res.json({
      success: true,
      userLocation: { latitude, longitude },
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get nearest products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearest products",
    });
  }
};


// TOGGLE WISHLIST
export const toggleWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "UserId and productId are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      user.wishlist.push(productId);
      await user.save();
      return res.json({
        success: true,
        message: "Added to wishlist",
        wishlist: user.wishlist,
      });
    }

    user.wishlist.splice(index, 1);
    await user.save();

    res.json({
      success: true,
      message: "Removed from wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update wishlist",
    });
  }
};

// GET USER WISHLIST
export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: "wishlist",
      populate: {
        path: "subCategory",
        select: "name",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    });
  }
};

// GET USER'S OWN PRODUCTS
export const getUserProducts = async (req, res) => {
  try {
    const { userId } = req.params;

    const products = await Product.find({ user: userId })
      .populate("subCategory", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get user products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user products",
    });
  }
}
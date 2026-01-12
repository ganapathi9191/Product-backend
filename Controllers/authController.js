// ============================================
// Controllers/authController.js
// ============================================
import jwt from "jsonwebtoken";
import User from "../Models/Auth.js";
import Category from "../Models/Category.js";
import SubCategory from "../Models/SubCategory.js";
import { uploadToCloudinary } from "../utils/upload.js";
import UserSubscription from "../Models/UserSubscription.js";

import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Plan from "../Models/Plan.js";

// SEND OTP

export const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const otp = "1234";

    const otpToken = jwt.sign(
      { mobile, otp },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    return res.json({
      success: true,
      message: "OTP sent successfully",
      otp,          // ❌ remove in production
      token: otpToken,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// VERIFY OTP


export const verifyOtp = async (req, res) => {
  const { otp, token } = req.body;

  if (!otp || !token) {
    return res.status(400).json({
      success: false,
      message: "OTP and token are required",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "OTP expired or invalid",
    });
  }

  if (otp !== decoded.otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  try {
    // 🔹 FIND OR CREATE USER
    let user = await User.findOne({ mobile: decoded.mobile });
    const isFirstTimeUser = !user;

    if (!user) {
      user = await User.create({ mobile: decoded.mobile });
    }

    // 🔹 CHECK IF USER ALREADY USED FREE PLAN
    const existingFreeSub = await UserSubscription.findOne({
      user: user._id,
      hasUsedFreePlan: true,
    });

    // 🔹 ASSIGN FREE PLAN ONLY ONCE
    if (!existingFreeSub) {
      // ✅ ENSURE FREE PLAN EXISTS
      let freePlan = await Plan.findOne({ price: 0 });

      if (!freePlan) {
        freePlan = await Plan.create({
          name: "Free Plan",
          price: 0,
          productLimit: 1,
          durationInDays: 30,
        });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + freePlan.durationInDays);

      await UserSubscription.create({
        user: user._id,
        plan: freePlan._id,
        startDate,
        endDate,
        productsLimit: freePlan.productLimit,
        productsCreated: 0,
        hasUsedFreePlan: true,
        isActive: true,
      });
    }

    // 🔹 AUTH TOKEN (USED FOR PROFILE, PRODUCT, ETC)
    const authToken = jwt.sign(
      {
        userId: user._id,
        mobile: user.mobile,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token: authToken,
      user,
    });
  } catch (error) {
    console.error("verifyOtp error:", error);

    return res.status(500).json({
      success: false,
      message: "Database error during OTP verification",
    });
  }
};


// RESEND OTP
export const resendOtp = async (req, res) => {
  const { mobile } = req.body;

  const token = jwt.sign(
    { mobile, otp: "1234" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  res.json({
    success: true,
    message: "OTP resent successfully",
    otp: "1234",
    token,
  });
};

// UPDATE PROFILE + IMAGE
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { mobile } = req.user;

    let profileImage;

    if (req.file) {
      const result = await uploadToCloudinary(req.file, "user_profiles");
      profileImage = result.secure_url;
    }

    const user = await User.findOneAndUpdate(
      { mobile },
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(profileImage && { profileImage }),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};

// UPDATE LIVE LOCATION
export const updateLiveLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude & longitude are required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Live location updated successfully",
      location: user.location,
    });
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
    });
  }
};

// GET PROFILE BY ID
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id).select("-__v -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};
// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-__v -password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: "Name required" });

    const exist = await Category.findOne({ name });
    if (exist)
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });

    const category = await Category.create({ name });
    res
      .status(201)
      .json({ success: true, message: "Category created", category });
  } catch (e) {
    res.status(500).json({ success: false, message: "Category create failed" });
  }
};

// GET ALL CATEGORIES
export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json({ success: true, categories });
};

// GET CATEGORY BY ID
export const getCategoryById = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, category });
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true }
  );
  res.json({ success: true, message: "Category updated", category });
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  await SubCategory.deleteMany({ category: req.params.id });
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Category & sub categories deleted" });
};


// CREATE SUB CATEGORY
export const createSubCategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Image required" });

    const result = await uploadToCloudinary(req.file, "sub_categories");

    const subCategory = await SubCategory.create({
      category: categoryId,
      name,
      image: result.secure_url,
    });

    res.status(201).json({
      success: true,
      message: "Sub category created",
      subCategory,
    });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Sub category create failed" });
  }
};

// GET ALL SUB CATEGORIES
export const getAllSubCategories = async (req, res) => {
  const subCategories = await SubCategory.find().populate("category", "name");
  res.json({ success: true, subCategories });
};

// GET SUB CATEGORIES BY CATEGORY
export const getSubCategoriesByCategory = async (req, res) => {
  const subCategories = await SubCategory.find({
    category: req.params.categoryId,
  }).populate("category", "name");
  res.json({ success: true, subCategories });
};

// GET SUB CATEGORY BY ID
export const getSubCategoryById = async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id).populate(
    "category",
    "name"
  );
  res.json({ success: true, subCategory });
};

// UPDATE SUB CATEGORY
export const updateSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    let updateData = { name, category: categoryId };

    if (req.file) {
      const result = await uploadToCloudinary(req.file, "sub_categories");
      updateData.image = result.secure_url;
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, message: "Sub category updated", subCategory });
  } catch (e) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

// DELETE SUB CATEGORY
export const deleteSubCategory = async (req, res) => {
  await SubCategory.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Sub category deleted" });
};


// CREATE PLAN
export const createPlan = async (req, res) => {
  try {
    const { name, price, productLimit, durationInDays } = req.body;

    if (!name || !productLimit || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: "Name, productLimit, and durationInDays are required",
      });
    }

    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Plan with this name already exists",
      });
    }

    const plan = await Plan.create({
      name,
      price: price || 0,
      productLimit,
      durationInDays,
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create plan",
    });
  }
};

// GET ALL PLANS
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });

    res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
    });
  }
};



// GET ALL PLANS
export const getAllPlansbyuser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // 🔹 Check active subscription
    const activeSubscription = await UserSubscription.findOne({
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() },
    }).populate("plan");

    // 🔹 First time user (has free plan active)
    if (activeSubscription && activeSubscription.plan.price === 0) {
      return res.json({
        success: true,
        plans: [activeSubscription.plan],
        note: "Free plan is active",
      });
    }

    // 🔹 Free plan exhausted or expired → show premium plans
    const premiumPlans = await Plan.find({
      price: { $gt: 0 },
      isActive: true,
    });

    res.json({
      success: true,
      plans: premiumPlans,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
    });
  }
};


// GET PLAN BY ID
export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Get plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plan",
    });
  }
};

// UPDATE PLAN
export const updatePlan = async (req, res) => {
  try {
    const { name, price, productLimit, durationInDays, isActive } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(price !== undefined && { price }),
        ...(productLimit && { productLimit }),
        ...(durationInDays && { durationInDays }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update plan",
    });
  }
};

// DELETE PLAN
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete plan",
    });
  }
};



// GET USER ACTIVE SUBSCRIPTION
export const getUserActiveSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await UserSubscription.findOne({
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() },
    })
      .populate("plan", "name price productLimit durationInDays")
      .populate("user", "name email mobile");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
    });
  }
};

// GET USER SUBSCRIPTION HISTORY
export const getUserSubscriptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptions = await UserSubscription.find({ user: userId })
      .populate("plan", "name price productLimit durationInDays")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("Get subscription history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription history",
    });
  }
};

// CHECK SUBSCRIPTION VALIDITY
export const checkSubscriptionValidity = async (userId) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    if (!subscription) {
      return {
        valid: false,
        message: "No active subscription",
      };
    }

    if (subscription.productsCreated >= subscription.productsLimit) {
      return {
        valid: false,
        message: "Product limit reached for current plan",
        subscription,
      };
    }

    return {
      valid: true,
      subscription,
    };
  } catch (error) {
    console.error("Check subscription error:", error);
    return {
      valid: false,
      message: "Error checking subscription",
    };
  }
};

// INCREMENT PRODUCT COUNT
export const incrementProductCount = async (userId) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    if (subscription) {
      subscription.productsCreated += 1;
      await subscription.save();
    }

    return subscription;
  } catch (error) {
    console.error("Increment product count error:", error);
    return null;
  }
};


// =======================================
// CREATE ORDER (Frontend handles payment)
// =======================================
export const createPlanOrder = async (req, res) => {
  try {
    const { userId, planId, transactionId } = req.body;

    if (!userId || !planId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "userId, planId, transactionId are required",
      });
    }

    // 🔹 Validate plan
    const plan = await Plan.findById(planId);
    if (!plan || plan.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    // 🔹 Prevent duplicate transaction
    const existingOrder = await UserSubscription.findOne({ transactionId });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Transaction already exists",
      });
    }

    // 🔹 Create Razorpay Order (optional but recommended)
    const razorpayOrder = await razorpay.orders.create({
      amount: plan.price * 1,
      currency: "INR",
      receipt: `txn_${transactionId}`,
    });

    // 🔹 Save subscription with transactionId
    const subscription = await UserSubscription.create({
      user: userId,
      plan: planId,
      transactionId,

      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
      isActive: false,
    });

    return res.json({
      success: true,
      message: "Order created successfully",
      razorpayOrder,
      transactionId,
      subscriptionId: subscription._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};

  


// =======================================
// VERIFY PAYMENT
// =======================================
export const verifyPlanPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required",
      });
    }

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const subscription = await UserSubscription.findOne({
      transactionId,
      razorpayOrderId: razorpay_order_id,
    }).populate("plan");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    subscription.paymentStatus = "completed";
    subscription.isActive = true;
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.razorpaySignature = razorpay_signature;

    subscription.startDate = new Date();
    subscription.endDate = new Date(
      Date.now() + subscription.plan.durationInDays * 86400000
    );
    subscription.productsLimit = subscription.plan.productLimit;

    await subscription.save();

    return res.json({
      success: true,
      message: "Plan activated successfully",
      subscription,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};


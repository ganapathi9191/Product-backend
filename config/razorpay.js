import Razorpay from "razorpay";

/**
 * Razorpay factory function
 * ❌ DOES NOT create instance at import time
 * ✅ SAFE even if env vars are missing
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys missing in environment variables");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

export default getRazorpayInstance;

import razorpay from "../config/razorpay.config.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import AppError from "../utils/AppError.js";

export const createRazorpayMedicineOrderService = async ({
  orderId,
  user
}) => {
  const order = await MedicineOrder.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  /* 🔐 Prevent wrong flow */
  if (order.paymentStatus === "PAID") {
    throw new AppError("Order already paid", 400);
  }

  /* 🔒 Lock payment mode to ONLINE */
  order.paymentMode = "ONLINE";
  order.paymentStatus = "PENDING";

  /* 🛑 If Razorpay order already exists, reuse it */
  if (order.razorpay?.orderId) {
    return {
      razorpayOrderId: order.razorpay.orderId,
      amount: Math.round(order.pricing.payableAmount * 100),
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        phone: user.phone
      }
    };
  }

  /* =========================
     CREATE RAZORPAY ORDER
  ========================= */
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.payableAmount * 100), // paise
    currency: "INR",
    receipt: `order_${order._id}`,
    notes: {
      medicineOrderId: order._id.toString(),
      userId: order.userId.toString()
    }
  });

  /* 💾 SAVE PAYMENT INFO */
  order.razorpay = {
    orderId: razorpayOrder.id
  };

  await order.save();

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    user: {
      name: user.name,
      phone: user.phone
    }
  };
};


export const verifyRazorpayPaymentService = async ({
  orderId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
}) => {
  const order = await MedicineOrder.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError("Payment already verified", 400);
  }

  /* =========================
     VERIFY SIGNATURE
  ========================= */
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new AppError("Payment verification failed", 400);
  }

  /* =========================
     GENERATE DELIVERY OTP
  ========================= */
  const otp = crypto.randomInt(100000, 1000000);

  /* =========================
     UPDATE ORDER
  ========================= */
  order.paymentStatus = "PAID";
  order.orderStatus = "CONFIRMED";

  order.otp = otp;
  order.otpVerified = false;

  order.razorpay = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  };

  await order.save();

  /* =========================
     RESPONSE (NO OTP)
  ========================= */
  return {
    orderId: order._id,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus
  };
};


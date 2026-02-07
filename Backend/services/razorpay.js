import razorpay from "../config/razorpay.config.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import AppError from "../utils/AppError.js";


export const createRazorpayOrderService = async ({
  orderId,
  user
}) => {
  const order = await MedicineOrder.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.paymentMode !== "ONLINE") {
    throw new AppError("Order is not ONLINE payment", 400);
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError("Order already paid", 400);
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.payableAmount * 100), // paise
    currency: "INR",
    receipt: `order_${order._id}`,
    notes: {
      medicineOrderId: order._id.toString(),
      userId: order.userId.toString()
    }
  });

  // 🔒 Save Razorpay orderId
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

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new AppError("Payment verification failed", 400);
  }

  // ✅ Payment verified
  order.paymentStatus = "PAID";
  order.orderStatus = "CONFIRMED";

  order.razorpay = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  };

  await order.save();

  return {
    orderId: order._id,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus
  };
};

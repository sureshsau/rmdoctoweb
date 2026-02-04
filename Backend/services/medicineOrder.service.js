import mongoose from "mongoose";
import Medicine from "../models/medicine.model.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";
import AgentProfile from '../models/agentProfile.model.js'
import User from "../models/user.model.js";

export const createMedicineOrder = async ({
  user,
  userId,
  items,
  deliveryAddress,
  paymentMode,
  allowSpecialPrice = false
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    let gstTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const medicine = await Medicine.findOne({
        _id: item.medicineId,
        isActive: true
      }).session(session);

      if (!medicine) {
        throw new AppError("Medicine not found or inactive", 400);
      }

      const canUseSpecialPrice =
        user.roles?.includes("agent");

      const unitPrice = canUseSpecialPrice
        ? medicine.pricing.specialPrice ?? medicine.pricing.price
        : medicine.pricing.price;

      const itemSubtotal = unitPrice * item.quantity;
      const gstPercentage = medicine.gstPercentage || 0;
      const gstAmount = (itemSubtotal * gstPercentage) / 100;
      const totalPrice = itemSubtotal + gstAmount;

      subtotal += itemSubtotal;
      gstTotal += gstAmount;

      processedItems.push({
        medicineId: medicine._id,
        quantity: item.quantity,
        unitPrice,
        gstPercentage,
        gstAmount,
        totalPrice
      });
    }

    // 🔗 Find delivery (marketing) agent
    let marketingAgentId = null;

    // CASE 1: User is agent
    if (user.roles.includes("agent")) {
      const agentProfile = await AgentProfile
        .findOne({ userId })
        .select("marketingAgentId")
        .lean();

      // If linked → use it
      if (agentProfile?.marketingAgentId) {
        marketingAgentId = agentProfile.marketingAgentId;
      }
    }

    // CASE 2: Not linked OR not an agent → pick random
    if (!marketingAgentId) {
      const [{ _id } = {}] = await User.aggregate([
        {
          $match: {
            roles: { $in: ["marketing_agent"] },
            isActive: true,
            isBlocked: false
          }
        },
        { $project: { _id: 1 } },
        { $sample: { size: 1 } }
      ]);

      if (!_id) {
        throw new AppError("No marketing agent available", 400);
      }

      marketingAgentId = _id;
    } else {
      const [{ _id } = {}] = await User.aggregate([
        {
          $match: {
            roles: { $in: ["marketing_agent"] },
            isActive: true,
            isBlocked: false
          }
        },
        { $project: { _id: 1 } },
        { $sample: { size: 1 } }
      ]);

      if (!_id) {
        throw new AppError("No marketing agent available", 400);
      }

      marketingAgentId = _id;
    }

    const payableAmount = subtotal + gstTotal;

    const [createdOrder] = await MedicineOrder.create(
      [
        {
          userId,
          deliveryAgentId: marketingAgentId,
          items: processedItems,
          pricing: {
            subtotal,
            gstTotal,
            payableAmount
          },
          deliveryAddress,
          paymentMode,
          paymentStatus: "PENDING",
          orderStatus: "INITIATED"
        }
      ],
      { session }
    );

    let paymentResponse;

    switch (paymentMode) {
      case "COD":
        paymentResponse = await handleCOD(createdOrder, session);
        break;

      case "ONLINE":
        break;

      case "RM_CREDIT":
        break;

      default:
        throw new AppError("Invalid payment mode", 400);
    }

    await session.commitTransaction();
    session.endSession();

    return paymentResponse || createdOrder;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


export const getUserMedicineOrdersOverview = async ({ userId }) => {
  const orders = await MedicineOrder.find({
    userId: new mongoose.Types.ObjectId(userId)
  })
    .sort({ createdAt: -1 }) // 🔥 latest first
    .select({
      items: { $slice: 1 }, // 🔥 only first medicine
      pricing: 1,
      paymentMode: 1,
      paymentStatus: 1,
      orderStatus: 1,
      createdAt: 1
    })
    .populate({
      path: "items.medicineId",
      select: "name images",
      options: { limit: 1 }
    });

  // 🔄 Format response (clean & frontend-friendly)
  return orders.map(order => {
    const firstItem = order.items[0];

    return {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      payableAmount: order.pricing.payableAmount,
      createdAt: order.createdAt,

      medicine: firstItem
        ? {
          name: firstItem.medicineId?.name || "",
          image:
            firstItem.medicineId?.images?.[0]?.url || null,
          quantity: firstItem.quantity
        }
        : null
    };
  });
};

export const getMedicineOrderDetails = async ({
  orderId,
  requester // { id, roles }
}) => {
  const order = await MedicineOrder.findById(orderId)
    .populate({
      path: "items.medicineId",
      select: "name brandName dosageForm images"
    })
    .populate({
      path: "deliveryAgentId",
      select: "name phone"
    })
    .lean();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner =
    order.userId.toString() === requester.id.toString();

  const isAdmin =
    requester.roles?.includes("admin");

  /* 🔐 OTP VISIBILITY RULE */
  if (!isOwner && !isAdmin) {
    delete order.otp;
  }

  /* 🔐 NEVER EXPOSE PAYMENT SECRETS */
  if (order.razorpay) {
    delete order.razorpay.signature;
  }

  /* 🧑‍✈️ DELIVERY AGENT DETAILS (USER MODEL) */
  let deliveryAgent = null;

  if (order.deliveryAgentId) {
    deliveryAgent = {
      id: order.deliveryAgentId._id,
      name: order.deliveryAgentId.name || null,
      phone: order.deliveryAgentId.phone || null
    };
  }

  return {
    orderId: order._id,

    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,

    pricing: order.pricing,
    deliveryAddress: order.deliveryAddress,

    deliveryAgent, // ✅ null if not assigned

    items: order.items.map(item => ({
      medicine: {
        id: item.medicineId._id,
        name: item.medicineId.name,
        brandName: item.medicineId.brandName,
        dosageForm: item.medicineId.dosageForm,
        image: item.medicineId.images?.[0]?.url || null
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstPercentage: item.gstPercentage,
      gstAmount: item.gstAmount,
      totalPrice: item.totalPrice
    })),

    otp: order.otp || null,
    otpVerified: order.otpVerified,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};



export const verifyOtpAndUpdateOrderStatus = async ({
  orderId,
  otp,
  requester // { id, roles }
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await MedicineOrder.findById(orderId)
      .session(session);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const isAdmin =
      requester.roles?.includes("admin") || requester.roles?.includes("subadmin");

    const isDeliveryAgent =
      order.deliveryAgentId &&
      order.deliveryAgentId.toString() === requester.id.toString();

    /* 🔐 AUTHORIZATION CHECK */
    if (!isAdmin && !isDeliveryAgent) {
      throw new AppError(
        "You are not authorized to verify this order",
        403
      );
    }

    /* ALREADY VERIFIED */
    if (order.otpVerified === true) {
      throw new AppError("OTP already verified", 400);
    }

    /* 🔐 OTP CHECK */
    if (!order.codOtp || order.codOtp !== otp) {
      throw new AppError("Invalid OTP", 400);
    }

    /* ✅ SUCCESS: UPDATE ORDER */
    order.otpVerified = true;
    order.paymentStatus = "PAID";
    order.orderStatus = "DELIVERED";
    order.codOtp = null; // 🔥 clear OTP after use
    order.deliveryStatus = "DELIVERED";

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      deliveredAt: new Date()
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


export const getAllMedicineOrdersOverview = async ({
  filters = {},
  page = 1,
  limit = 20
}) => {
  const query = {};

  /* 🔎 FILTERS */
  if (filters.orderStatus)
    query.orderStatus = filters.orderStatus;

  if (filters.paymentStatus)
    query.paymentStatus = filters.paymentStatus;

  if (filters.paymentMode)
    query.paymentMode = filters.paymentMode;

  if (filters.deliveryStatus)
    query.deliveryStatus = filters.deliveryStatus;

  if (filters.userId)
    query.userId = filters.userId;

  if (filters.deliveryAgentId)
    query.deliveryAgentId = filters.deliveryAgentId;

  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate)
      query.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate)
      query.createdAt.$lte = new Date(filters.toDate);
  }

  /* 📦 QUERY */
  const orders = await MedicineOrder.find(query)
    .sort({ createdAt: -1 }) // 🔥 latest first
    .skip((page - 1) * limit)
    .limit(limit)
    .select({
      items: { $slice: 1 }, // 🔥 only first medicine
      pricing: 1,
      paymentMode: 1,
      paymentStatus: 1,
      orderStatus: 1,
      deliveryStatus: 1,
      userId: 1,
      deliveryAgentId: 1,
      createdAt: 1
    })
    .populate({
      path: "items.medicineId",
      select: "name images"
    })
    .populate({
      path: "deliveryAgentId",
      populate: {
        path: "userId",
        select: "name phone"
      }
    })
    .lean();

  /* 🔄 FORMAT RESPONSE */
  return orders.map(order => {
    const firstItem = order.items?.[0];

    return {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      deliveryStatus: order.deliveryStatus,

      payableAmount: order.pricing?.payableAmount || 0,

      createdAt: order.createdAt,

      medicine: firstItem
        ? {
          name: firstItem.medicineId?.name || null,
          image:
            firstItem.medicineId?.images?.[0]?.url || null,
          quantity: firstItem.quantity
        }
        : null,

      deliveryAgent: order.deliveryAgentId
        ? {
          id: order.deliveryAgentId._id,
          name: order.deliveryAgentId.userId?.name || null,
          phone: order.deliveryAgentId.userId?.phone || null
        }
        : null
    };
  });
};


/* 🔐 Generate 6-digit OTP */
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};


export const handleCOD = async (order, session) => {
  const otp = generateOTP();
  console.log(otp);

  order.paymentStatus = "PENDING";     // COD not paid yet
  order.orderStatus = "CONFIRMED";     // Order accepted
  order.otp = otp;                  // 🔥 save OTP
  order.otpVerified = false;           // delivery pending

  await order.save({ session });

  // ⚠️ Do NOT return OTP in production response
  return {
    orderId: order._id,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus
  };
};

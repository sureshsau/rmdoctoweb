import mongoose from "mongoose";
import Medicine from "../models/medicine.model.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";
import AgentProfile from '../models/agentProfile.model.js'
import User from "../models/user.model.js";
import RMCredit from "../models/rmcredit/rmcredit.model.js";
import RMCreditTransaction from "../models/rmcredit/rmcreditTransaction.model.js";

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
        console.log("marketing agent id found", marketingAgentId);
      }
    }

    const payableAmount = subtotal + gstTotal;

    const [createdOrder] = await MedicineOrder.create(
      [
        {
          userId,
          marketingAgentId,
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
        // Only agents can use RM Credit
        if (!user.roles.includes("agent")) {
          throw new AppError("Only agents can use RM Credit", 403);
        }

        const wallet = await RMCredit.findOne({ agentId: userId })
          .session(session);

        if (!wallet) {
          throw new AppError("RM Credit wallet not found", 400);
        }

        // Check expiry
        if (wallet.expiryDate < new Date()) {
          throw new AppError("RM Credit expired", 400);
        }

        // Check balance
        if (wallet.balance < payableAmount) {
          throw new AppError("Insufficient RM Credit balance", 400);
        }

        // Deduct credit
        wallet.balance -= payableAmount;
        wallet.usedCredit += payableAmount;

        await wallet.save({ session });

        // Update order as paid
        createdOrder.paymentStatus = "PAID";
        createdOrder.orderStatus = "CONFIRMED";
        createdOrder.codOtp = generateOTP(); // 🔐 generate OTP for delivery

        await createdOrder.save({ session });

        // Create credit transaction log
        await RMCreditTransaction.create(
          [
            {
              walletId: wallet._id,
              agentId: userId,
              medicineOrderId: createdOrder._id,
              amount: payableAmount,
              type: "debit",
              performedBy: userId,
              description: "Medicine purchase via RM Credit"
            }
          ],
          { session }
        );

        paymentResponse = createdOrder;


        break;

      default:
        throw new AppError("Invalid payment mode", 400);
    }

    await session.commitTransaction();
    session.endSession();

    return paymentResponse || createdOrder;

  } catch (error) {
    console.error("Error in createMedicineOrder:", error);
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

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;

  const query = {};

  // ----------- ORDER STATUS -----------
  if (
    filters.orderStatus &&
    filters.orderStatus !== "null" &&
    filters.orderStatus !== "undefined"
  ) {
    query.orderStatus = filters.orderStatus;
  }

  // ----------- PAYMENT STATUS -----------
  if (
    filters.paymentStatus &&
    filters.paymentStatus !== "null" &&
    filters.paymentStatus !== "undefined"
  ) {
    query.paymentStatus = filters.paymentStatus;
  }

  // ----------- PAYMENT MODE -----------
  if (
    filters.paymentMode &&
    filters.paymentMode !== "null" &&
    filters.paymentMode !== "undefined"
  ) {
    query.paymentMode = filters.paymentMode;
  }

  // ----------- CUSTOMER FILTER -----------
  if (
    filters.userId &&
    filters.userId !== "null" &&
    filters.userId !== "undefined" &&
    mongoose.Types.ObjectId.isValid(filters.userId)
  ) {
    query.userId = new mongoose.Types.ObjectId(filters.userId);
  }

  // ----------- RM RIDER FILTER -----------
  if (
    filters.deliveryAgentId &&
    filters.deliveryAgentId !== "null" &&
    filters.deliveryAgentId !== "undefined" &&
    mongoose.Types.ObjectId.isValid(filters.deliveryAgentId)
  ) {
    query.deliveryAgentId = new mongoose.Types.ObjectId(
      filters.deliveryAgentId
    );
  }

  // ----------- MARKETING AGENT FILTER -----------
  if (
    filters.marketingAgentId &&
    filters.marketingAgentId !== "null" &&
    filters.marketingAgentId !== "undefined" &&
    mongoose.Types.ObjectId.isValid(filters.marketingAgentId)
  ) {
    query.marketingAgentId = new mongoose.Types.ObjectId(
      filters.marketingAgentId
    );
  }

  // ----------- DATE FILTER -----------
  // ----------- DATE FILTER (FIXED) -----------

const isValidFromDate =
  filters.fromDate &&
  filters.fromDate !== "null" &&
  filters.fromDate !== "undefined" &&
  filters.fromDate !== "" &&
  !isNaN(new Date(filters.fromDate));

const isValidToDate =
  filters.toDate &&
  filters.toDate !== "null" &&
  filters.toDate !== "undefined" &&
  filters.toDate !== "" &&
  !isNaN(new Date(filters.toDate));

if (isValidFromDate || isValidToDate) {
  query.createdAt = {};

  if (isValidFromDate) {
    query.createdAt.$gte = new Date(filters.fromDate);
  }

  if (isValidToDate) {
    const end = new Date(filters.toDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt.$lte = end;
  }
}

  console.log("Final Query:", query);

  // ----------- TOTAL COUNT -----------
  const totalRecords = await MedicineOrder.countDocuments(query);

  // ----------- FETCH DATA -----------
  const orders = await MedicineOrder.find(query)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .select(
      "items pricing paymentMode paymentStatus orderStatus userId deliveryAgentId marketingAgentId createdAt"
    )
    .populate("items.medicineId", "name images")
    .populate("userId", "name phone")
    .populate("deliveryAgentId", "name phone")
    .populate("marketingAgentId", "name phone")
    .lean();

  // ----------- RESPONSE MAPPING -----------
  const data = orders.map(order => {
    const firstItem = order.items?.[0];

    return {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      payableAmount: order.pricing?.payableAmount || 0,
      createdAt: order.createdAt,
      customer: order.userId,
      marketingAgent: order.marketingAgentId,
      deliveryAgent: order.deliveryAgentId,
      medicine: firstItem
        ? {
            name: firstItem.medicineId?.name,
            image: firstItem.medicineId?.images?.[0]?.url,
            quantity: firstItem.quantity
          }
        : null
    };
  });

  return {
    page: currentPage,
    totalPages: Math.ceil(totalRecords / perPage),
    totalRecords,
    data
  };
};




/* 🔐 Generate 6-digit OTP */
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};


export const handleCOD = async (order, session) => {
  const otp = generateOTP();

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


const VALID_TRANSITIONS = {
  INITIATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "DELIVERED", "CANCELLED"], // ✅ added DELIVERED
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: []
};

export const updateOrderStatusService = async ({
  orderId,
  newStatus,
  marketingAgentUserId,
  cancelReason,
  enteredOtp
}) => {
  const order = await MedicineOrder.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  /* 🔐 AUTHORIZATION */
  if (
    !order.deliveryAgentId ||
    order.deliveryAgentId.toString() !== marketingAgentUserId.toString()
  ) {
    throw new AppError("Not authorized to update this order", 403);
  }

  /* 🔁 VALID STATUS TRANSITION */
  const allowed = VALID_TRANSITIONS[order.orderStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot change order from ${order.orderStatus} to ${newStatus}`,
      400
    );
  }

  /*  DELIVERY WITH OTP VERIFICATION */
  if (newStatus === "DELIVERED") {

    if (!enteredOtp) {
      throw new AppError("OTP is required to deliver this order", 400);
    }

    if (!order.otp || order.otp !== Number(enteredOtp)) {
      throw new AppError("Invalid OTP", 400);
    }

    order.otpVerified = true;
    order.paymentStatus = "PAID";
  }

  if (newStatus === "CANCELLED") {
    order.cancelledReason = cancelReason || "Cancelled by delivery agent";
  }

  order.orderStatus = newStatus;

  await order.save();

  return order;
};


export const getUserMedicineOrderTotalService = async ({
  userId,
  startDate,
  endDate,
}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    orderStatus: "DELIVERED", // only count delivered orders
  };

  /* ✅ DATE RANGE FILTER */
  if (startDate || endDate) {
    matchStage.createdAt = {};

    if (startDate) {
      matchStage.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      matchStage.createdAt.$lte = new Date(endDate);
    }
  }

  const result = await MedicineOrder.aggregate([
    { $match: matchStage },

    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$pricing.payableAmount" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  return {
    totalAmount: result[0]?.totalAmount || 0,
    totalOrders: result[0]?.totalOrders || 0,
  };
};


export const getOrdersForRmRiderService = async ({
  rmRiderUserId,
  status,
  page = 1,
  limit = 10
}) => {
  const query = {
    deliveryAgentId: rmRiderUserId
  };

  if (status) {
    query.orderStatus = status;
  }

  const skip = (page - 1) * limit;

  /* =========================
     PARALLEL DB CALLS
  ========================= */
  const [orders, totalOrders] = await Promise.all([
    MedicineOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "name phone"
      })
      .populate({
        path: "items.medicineId",
        select: "name images"
      })
      .lean(),

    MedicineOrder.countDocuments(query)
  ]);

  /* =========================
     OVERVIEW SHAPE
  ========================= */
  const overviewOrders = orders.map(order => ({
    orderId: order._id,

    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,

    customer: {
      name: order.userId?.name || null,
      phone: order.userId?.phone || null
    },

    itemCount: order.items.length,

    totalAmount: order.pricing.payableAmount,

    deliveryAddress: {
      addressLine1: order.deliveryAddress.addressLine1,
      pincode: order.deliveryAddress.pincode
    },

    createdAt: order.createdAt
  }));

  return {
    orders: overviewOrders,
    pagination: {
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit
    }
  };
};
// services/labOrder.service.js
import mongoose from "mongoose";
import LabTest from "../models/lab/labTest.model.js";
import LabOrder from "../models/lab/labOrder.model.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";
import AgentProfile from "../models/agentProfile.model.js";
import User from "../models/user.model.js";
import RMCredit from "../models/rmcredit/rmcredit.model.js";
import RMCreditTransaction from "../models/rmcredit/rmcreditTransaction.model.js";
import RMCoinsTransaction from "../models/rmcoinTransfer.model.js";
import { s3 } from "../config/aws.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/* ════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════ */
const generateOTP = () => crypto.randomInt(100000, 1000000);

/* ════════════════════════════════════════════════
   S3 — PRESCRIPTION UPLOAD
════════════════════════════════════════════════ */
export const uploadLabPrescriptionToS3 = async ({
  orderId,
  fileBuffer,
  mimeType,
  fileName
}) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!fileBuffer || !bucketName) {
    throw new AppError("Missing file upload parameters", 400);
  }

  const safeFileName = decodeURIComponent(fileName).replace(/[^a-zA-Z0-9.\-]/g, "_");
  const ext = mimeType === "application/pdf" ? "pdf" : (mimeType.split("/")[1] || "jpg");
  const key = `lab-prescriptions/${orderId}/${Date.now()}-${safeFileName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentDisposition: "inline"
    })
  );

  return {
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
    key
  };
};

const deleteFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key })
    );
  } catch (error) {
    console.warn(`Failed to delete S3 object (${key}):`, error.message);
  }
};

/* ════════════════════════════════════════════════
   CREATE LAB ORDER
   (mirrors createMedicineOrder exactly)
════════════════════════════════════════════════ */
export const createLabOrder = async ({
  user,
  userId,
  labId,
  items,         // [{ testId, quantity }]
  collectionType,
  collectionAddress,
  scheduledAt,
  paymentMode
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    let gstTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const test = await LabTest.findOne({
        _id: item.testId,
        isActive: true
      }).session(session);

      if (!test) throw new AppError("Lab test not found or inactive", 400);

      // ── DUAL PRICING: agents get agentPrice, users get userPrice ──
      const isAgent = user.roles?.includes("agent");
      const unitPrice = isAgent
        ? (test.pricing.agentPrice ?? test.pricing.userPrice)
        : test.pricing.userPrice;

      const qty = item.quantity || 1;
      const itemSubtotal = Number((unitPrice * qty).toFixed(2));
      const gstPct = test.gstPercentage || 0;
      const gstAmount = Number(((itemSubtotal * gstPct) / 100).toFixed(2));
      const totalPrice = Number((itemSubtotal + gstAmount).toFixed(2));

      subtotal += itemSubtotal;
      gstTotal += gstAmount;

      processedItems.push({
        testId: test._id,
        quantity: qty,
        unitPrice,
        gstPercentage: gstPct,
        gstAmount,
        totalPrice
      });
    }

    // ── RESOLVE MARKETING AGENT (same as medicine) ──────────────────
    let marketingAgentId = null;

    if (user.roles?.includes("agent")) {
      const agentProfile = await AgentProfile
        .findOne({ userId })
        .select("marketingAgentId")
        .lean();

      if (agentProfile?.marketingAgentId) {
        marketingAgentId = agentProfile.marketingAgentId;
      }
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    gstTotal = parseFloat(gstTotal.toFixed(2));
    const homeCollectionCharge = 0; // can be made dynamic later
    const payableAmount = parseFloat((subtotal + gstTotal + homeCollectionCharge).toFixed(2));

    const [createdOrder] = await LabOrder.create(
      [
        {
          userId,
          marketingAgentId,
          labId,
          items: processedItems,
          pricing: { subtotal, gstTotal, homeCollectionCharge, payableAmount },
          collectionType: collectionType || "HOME",
          collectionAddress: collectionType === "HOME" ? {
            ...collectionAddress,
            location: collectionAddress?.location?.coordinates ? collectionAddress.location : { type: "Point", coordinates: [0, 0] }
          } : undefined,
          scheduledAt,
          paymentMode,
          paymentStatus: "PENDING",
          orderStatus: "INITIATED"
        }
      ],
      { session }
    );

    // ── PAYMENT SWITCH ───────────────────────────────────────────────
    let paymentResponse;

    switch (paymentMode) {
      case "COD":
        // COD — no immediate deduction; agent collects cash on sample pickup
        createdOrder.otp = generateOTP();
        await createdOrder.save({ session });
        paymentResponse = createdOrder;
        break;

      case "ONLINE":
        // Razorpay flow initiated after order creation (separate endpoint)
        paymentResponse = createdOrder;
        break;

      case "RM_CREDIT":
        if (!user.roles?.includes("agent")) {
          throw new AppError("Only agents can use RM Credit", 403);
        }

        const wallet = await RMCredit.findOne({ agentId: userId }).session(session);
        if (!wallet) throw new AppError("RM Credit wallet not found", 400);
        if (wallet.expiryDate < new Date()) throw new AppError("RM Credit expired", 400);
        if (wallet.balance < payableAmount) throw new AppError("Insufficient RM Credit balance", 400);

        wallet.balance = parseFloat((wallet.balance - payableAmount).toFixed(2));
        wallet.usedCredit = parseFloat((wallet.usedCredit + payableAmount).toFixed(2));
        await wallet.save({ session });

        createdOrder.paymentStatus = "PAID";
        createdOrder.orderStatus = "CONFIRMED";
        createdOrder.otp = generateOTP();
        await createdOrder.save({ session });

        await RMCreditTransaction.create(
          [
            {
              walletId: wallet._id,
              agentId: userId,
              amount: payableAmount,
              type: "debit",
              performedBy: userId,
              description: "Lab booking via RM Credit"
            }
          ],
          { session }
        );

        paymentResponse = createdOrder;
        break;

      case "RM_COIN":
        const userForCoins = await User.findById(userId).session(session);
        if (!userForCoins) throw new AppError("User not found", 404);
        if (userForCoins.rmCoinsBalance < payableAmount) {
          throw new AppError("Insufficient RM Coin balance", 400);
        }

        userForCoins.rmCoinsBalance = parseFloat(
          (userForCoins.rmCoinsBalance - payableAmount).toFixed(2)
        );
        await userForCoins.save({ session });

        createdOrder.paymentStatus = "PAID";
        createdOrder.orderStatus = "CONFIRMED";
        createdOrder.otp = generateOTP();
        await createdOrder.save({ session });

        await RMCoinsTransaction.create(
          [
            {
              fromUserId: userId,
              toUserId: userId,
              amount: payableAmount,
              type: "lab_order",
              description: "Lab booking via RM Coins"
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
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/* ════════════════════════════════════════════════
   GET USER OWN ORDERS (overview)
════════════════════════════════════════════════ */
export const getUserLabOrdersOverview = async ({ userId, page = 1, limit = 10 }) => {
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 10;
  const skip = (currentPage - 1) * perPage;

  const matchQuery = { userId };

  const [orders, totalOrders, totalPaidResult] = await Promise.all([
    LabOrder.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .select({
        items: { $slice: 1 },
        pricing: 1,
        paymentMode: 1,
        paymentStatus: 1,
        orderStatus: 1,
        scheduledAt: 1,
        createdAt: 1
      })
      .populate({ path: "items.testId", select: "name shortCode category" })
      .populate({ path: "labId", select: "name address.city" })
      .lean(),

    LabOrder.countDocuments(matchQuery),

    LabOrder.aggregate([
      { $match: { userId, paymentStatus: "PAID" } },
      { $group: { _id: null, totalPaidAmount: { $sum: "$pricing.payableAmount" } } }
    ])
  ]);

  const totalPaidAmount = totalPaidResult[0]?.totalPaidAmount || 0;

  const formattedOrders = orders.map((order) => {
    const firstItem = order.items?.[0];
    return {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      payableAmount: order.pricing?.payableAmount || 0,
      scheduledAt: order.scheduledAt,
      lab: order.labId ? { name: order.labId.name, city: order.labId.address?.city } : null,
      test: firstItem
        ? { name: firstItem.testId?.name || "", shortCode: firstItem.testId?.shortCode || "" }
        : null,
      createdAt: order.createdAt
    };
  });

  return {
    orders: formattedOrders,
    totalPaidAmount,
    pagination: {
      totalOrders,
      currentPage,
      totalPages: Math.ceil(totalOrders / perPage),
      limit: perPage
    }
  };
};

/* ════════════════════════════════════════════════
   GET SINGLE ORDER DETAILS
════════════════════════════════════════════════ */
export const getLabOrderDetails = async ({ orderId, requester }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await LabOrder.findById(orderId)
    .populate({ path: "items.testId", select: "name shortCode category sampleType" })
    .populate({ path: "labId", select: "name brandName address phone email" })
    .populate({ path: "collectionAgentId", select: "name phone" })
    .lean();

  if (!order) throw new AppError("Order not found", 404);

  const isOwner = order.userId && order.userId._id ? order.userId._id.toString() === requester.id.toString() : false;
  const isAdmin = requester.roles?.some((r) =>
    ["admin", "subadmin", "receptionist"].includes(r)
  );
  const isCollectionAgent = order.collectionAgentId && order.collectionAgentId._id 
    ? order.collectionAgentId._id.toString() === requester.id.toString()
    : false;

  if (!isOwner && !isAdmin && !isCollectionAgent) {
    throw new AppError("Forbidden: You are not authorized to view this order", 403);
  }

  // Never expose razorpay signature to client
  if (order.razorpay) delete order.razorpay.signature;

  return {
    orderId: order._id,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,
    pricing: order.pricing,
    collectionType: order.collectionType,
    scheduledAt: order.scheduledAt,
    collectionAddress: order.collectionAddress,
    lab: order.labId,
    collectionAgent: order.collectionAgentId
      ? { id: order.collectionAgentId._id, name: order.collectionAgentId.name, phone: order.collectionAgentId.phone }
      : null,
    items: order.items.map((item) => ({
      test: {
        id: item.testId?._id,
        name: item.testId?.name,
        shortCode: item.testId?.shortCode,
        category: item.testId?.category,
        sampleType: item.testId?.sampleType
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstPercentage: item.gstPercentage,
      gstAmount: item.gstAmount,
      totalPrice: item.totalPrice
    })),
    otp: order.otp || null,
    otpVerified: order.otpVerified,
    reportUrl: order.reportUrl || null,
    prescription: order.prescription?.url
      ? { url: order.prescription.url, uploadedAt: order.prescription.uploadedAt }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

/* ════════════════════════════════════════════════
   GET ALL ORDERS (admin overview)
════════════════════════════════════════════════ */
export const getAllLabOrdersOverview = async ({ filters = {}, page = 1, limit = 20 }) => {
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;

  const query = {};

  const isValidId = (v) => v && v !== "null" && v !== "undefined" && mongoose.Types.ObjectId.isValid(v);
  const isValidStr = (v) => v && v !== "null" && v !== "undefined";

  if (isValidStr(filters.orderStatus)) query.orderStatus = filters.orderStatus;
  if (isValidStr(filters.paymentStatus)) query.paymentStatus = filters.paymentStatus;
  if (isValidStr(filters.paymentMode)) query.paymentMode = filters.paymentMode;
  if (isValidStr(filters.collectionType)) query.collectionType = filters.collectionType;
  if (isValidId(filters.userId)) query.userId = new mongoose.Types.ObjectId(filters.userId);
  if (isValidId(filters.labId)) query.labId = new mongoose.Types.ObjectId(filters.labId);
  if (isValidId(filters.collectionAgentId)) {
    query.collectionAgentId = new mongoose.Types.ObjectId(filters.collectionAgentId);
  }

  // Date filter
  const isValidDate = (v) => v && v !== "null" && v !== "undefined" && !isNaN(new Date(v));
  if (isValidDate(filters.fromDate) || isValidDate(filters.toDate)) {
    query.createdAt = {};
    if (isValidDate(filters.fromDate)) query.createdAt.$gte = new Date(filters.fromDate);
    if (isValidDate(filters.toDate)) {
      const end = new Date(filters.toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const totalRecords = await LabOrder.countDocuments(query);

  const orders = await LabOrder.find(query)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .select("items pricing paymentMode paymentStatus orderStatus collectionType scheduledAt userId collectionAgentId marketingAgentId labId createdAt")
    .populate("items.testId", "name shortCode")
    .populate("userId", "name phone")
    .populate("collectionAgentId", "name phone")
    .populate("marketingAgentId", "name phone")
    .populate("labId", "name address.city")
    .lean();

  const data = orders.map((order) => ({
    orderId: order._id,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,
    collectionType: order.collectionType,
    payableAmount: order.pricing?.payableAmount || 0,
    scheduledAt: order.scheduledAt,
    lab: order.labId ? { name: order.labId.name, city: order.labId.address?.city } : null,
    user: order.userId ? { id: order.userId._id, name: order.userId.name, phone: order.userId.phone } : null,
    collectionAgent: order.collectionAgentId
      ? { id: order.collectionAgentId._id, name: order.collectionAgentId.name }
      : null,
    testsCount: order.items?.length || 0,
    createdAt: order.createdAt
  }));

  return {
    data,
    pagination: {
      total: totalRecords,
      page: currentPage,
      limit: perPage,
      totalPages: Math.ceil(totalRecords / perPage)
    }
  };
};

/* ════════════════════════════════════════════════
   GET RIDER ASSIGNED LAB ORDERS
════════════════════════════════════════════════ */
export const getAssignedLabOrdersForRiderService = async (riderId) => {
  const orders = await LabOrder.find({ collectionAgentId: riderId })
    .sort({ createdAt: -1 })
    .select("items pricing paymentMode paymentStatus orderStatus collectionType scheduledAt collectionAddress userId labId createdAt")
    .populate("items.testId", "name shortCode")
    .populate("userId", "name phone")
    .populate("labId", "name address.city")
    .lean();

  return orders.map((order) => ({
    orderId: order._id,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,
    collectionType: order.collectionType,
    payableAmount: order.pricing?.payableAmount || 0,
    scheduledAt: order.scheduledAt,
    collectionAddress: order.collectionAddress,
    user: order.userId ? { id: order.userId._id, name: order.userId.name, phone: order.userId.phone } : null,
    lab: order.labId ? { id: order.labId._id, name: order.labId.name, city: order.labId.address?.city } : null,
    itemsCount: order.items.length,
    tests: order.items.map((i) => i.testId?.name).filter(Boolean),
    createdAt: order.createdAt
  }));
};

/* ════════════════════════════════════════════════
   UPDATE ORDER STATUS
════════════════════════════════════════════════ */
export const updateLabOrderStatusService = async ({
  orderId,
  newStatus,
  cancelReason,
  requester
}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await LabOrder.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const isAdmin = requester.roles?.some((r) =>
    ["admin", "subadmin", "receptionist"].includes(r)
  );
  if (!isAdmin) throw new AppError("Forbidden", 403);

  const VALID_TRANSITIONS = {
    INITIATED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SAMPLE_COLLECTED", "CANCELLED"],
    SAMPLE_COLLECTED: ["REPORT_PENDING"],
    REPORT_PENDING: ["REPORT_READY"],
    REPORT_READY: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: []
  };

  const allowed = VALID_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot move order from ${order.orderStatus} to ${newStatus}`,
      400
    );
  }

  order.orderStatus = newStatus;

  if (newStatus === "CONFIRMED" && !order.otp) {
    order.otp = generateOTP();
  }
  if (newStatus === "CANCELLED") {
    order.cancelledReason = cancelReason || "Cancelled by admin";
  }

  await order.save();
  return order;
};

/* ════════════════════════════════════════════════
   OTP VERIFY (sample collection)
════════════════════════════════════════════════ */
export const verifyLabOtpService = async ({ orderId, otp, requester }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await LabOrder.findById(orderId).session(session);
    if (!order) throw new AppError("Order not found", 404);

    const isAdmin = requester.roles?.some((r) => ["admin", "subadmin"].includes(r));
    const isCollectionAgent =
      order.collectionAgentId &&
      order.collectionAgentId.toString() === requester.id.toString();

    if (!isAdmin && !isCollectionAgent) {
      throw new AppError("You are not authorized to verify this order", 403);
    }

    if (order.otpVerified) throw new AppError("OTP already verified", 400);
    if (!order.otp || order.otp !== Number(otp)) throw new AppError("Invalid OTP", 400);

    order.otpVerified = true;
    order.orderStatus = "SAMPLE_COLLECTED";
    // COD — mark paid on collection
    if (order.paymentMode === "COD") {
      order.paymentStatus = "PAID";
    }
    order.otp = null;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return { orderId: order._id, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus };

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/* ════════════════════════════════════════════════
   ASSIGN COLLECTION AGENT
════════════════════════════════════════════════ */
export const assignCollectionAgentService = async ({ orderId, agentUserId, requester }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(agentUserId)) {
    throw new AppError("Invalid orderId or userId", 400);
  }

  const isAdmin = requester.roles?.some((r) =>
    ["admin", "subadmin", "receptionist"].includes(r)
  );
  if (!isAdmin) throw new AppError("Forbidden", 403);

  const agent = await User.findOne({
    _id: agentUserId,
    roles: { $in: ["rmrider"] },
    isActive: true,
    isBlocked: false
  });
  if (!agent) throw new AppError("User is not a valid RM Rider", 400);

  const order = await LabOrder.findByIdAndUpdate(
    orderId,
    { collectionAgentId: agentUserId },
    { new: true }
  ).populate("collectionAgentId", "name phone");

  if (!order) throw new AppError("Order not found", 404);
  return order;
};

/* ════════════════════════════════════════════════
   PRESCRIPTION UPLOAD / VIEW / DELETE
════════════════════════════════════════════════ */
export const uploadPrescriptionService = async ({
  orderId,
  requester,
  file
}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await LabOrder.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const isOwner = order.userId.toString() === requester.id.toString();
  if (!isOwner) throw new AppError("Forbidden: Only the booking owner can upload a prescription", 403);

  const LOCKED_STATUSES = ["SAMPLE_COLLECTED", "REPORT_PENDING", "REPORT_READY", "COMPLETED", "CANCELLED"];
  if (LOCKED_STATUSES.includes(order.orderStatus)) {
    throw new AppError(`Cannot upload prescription when order is ${order.orderStatus}`, 400);
  }

  // Delete old prescription from S3 if exists
  if (order.prescription?.key) {
    await deleteFromS3(order.prescription.key);
  }

  const result = await uploadLabPrescriptionToS3({
    orderId,
    fileBuffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname
  });

  order.prescription = {
    url: result.url,
    key: result.key,
    uploadedAt: new Date()
  };

  await order.save();
  return { url: result.url, uploadedAt: order.prescription.uploadedAt };
};

export const getPrescriptionService = async ({ orderId, requester }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await LabOrder.findById(orderId).select("userId prescription");
  if (!order) throw new AppError("Order not found", 404);

  const isOwner = order.userId.toString() === requester.id.toString();
  const isAdmin = requester.roles?.some((r) =>
    ["admin", "subadmin", "receptionist"].includes(r)
  );

  if (!isOwner && !isAdmin) {
    throw new AppError("Forbidden", 403);
  }

  if (!order.prescription?.url) {
    throw new AppError("No prescription uploaded for this order", 404);
  }

  return { url: order.prescription.url, uploadedAt: order.prescription.uploadedAt };
};

export const deletePrescriptionService = async ({ orderId, requester }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await LabOrder.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const isOwner = order.userId.toString() === requester.id.toString();
  if (!isOwner) throw new AppError("Forbidden", 403);

  const LOCKED_STATUSES = ["SAMPLE_COLLECTED", "REPORT_PENDING", "REPORT_READY", "COMPLETED", "CANCELLED"];
  if (LOCKED_STATUSES.includes(order.orderStatus)) {
    throw new AppError(`Cannot delete prescription when order is ${order.orderStatus}`, 400);
  }

  if (!order.prescription?.key) throw new AppError("No prescription to delete", 404);

  await deleteFromS3(order.prescription.key);
  order.prescription = { url: null, key: null, uploadedAt: null };
  await order.save();
  return true;
};

/* ════════════════════════════════════════════════
   REPORT UPLOAD (admin)
════════════════════════════════════════════════ */
export const uploadReportToS3 = async ({ orderId, fileBuffer, mimeType, fileName }) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  const safeFileName = decodeURIComponent(fileName).replace(/[^a-zA-Z0-9.\-]/g, "_");
  const ext = mimeType === "application/pdf" ? "pdf" : (mimeType.split("/")[1] || "jpg");
  const key = `lab-reports/${orderId}/${Date.now()}-${safeFileName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentDisposition: "inline"
    })
  );

  return {
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
    key
  };
};

export const uploadLabReportService = async ({ orderId, requester, file }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const isAdmin = requester.roles?.some((r) =>
    ["admin", "subadmin", "receptionist"].includes(r)
  );
  if (!isAdmin) throw new AppError("Only admin can upload reports", 403);

  const order = await LabOrder.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  // Delete old report if exists
  if (order.reportKey) await deleteFromS3(order.reportKey);

  const result = await uploadReportToS3({
    orderId,
    fileBuffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname
  });

  order.reportUrl = result.url;
  order.reportKey = result.key;
  order.orderStatus = "REPORT_READY";

  await order.save();
  return { reportUrl: order.reportUrl, orderStatus: order.orderStatus };
};

/* ════════════════════════════════════════════════
   RAZORPAY — CREATE + VERIFY (lab orders)
════════════════════════════════════════════════ */
import razorpay from "../config/razorpay.config.js";

export const createRazorpayLabOrderService = async ({ orderId, user }) => {
  const order = await LabOrder.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.paymentStatus === "PAID") throw new AppError("Order already paid", 400);

  order.paymentMode = "ONLINE";
  order.paymentStatus = "PENDING";

  if (order.razorpay?.orderId) {
    return {
      razorpayOrderId: order.razorpay.orderId,
      amount: Math.round(order.pricing.payableAmount * 100),
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID
    };
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.payableAmount * 100),
    currency: "INR",
    receipt: `laborder_${order._id}`,
    notes: { labOrderId: order._id.toString(), userId: order.userId.toString() }
  });

  order.razorpay = { orderId: razorpayOrder.id };
  await order.save();

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID
  };
};

export const verifyRazorpayLabPaymentService = async ({
  orderId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
}) => {
  const order = await LabOrder.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.paymentStatus === "PAID") throw new AppError("Payment already verified", 400);

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    throw new AppError("Payment verification failed", 400);
  }

  order.paymentStatus = "PAID";
  order.orderStatus = "CONFIRMED";
  order.otp = generateOTP();
  order.otpVerified = false;
  order.razorpay = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  };

  await order.save();

  return { orderId: order._id, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus };
};

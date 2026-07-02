// controllers/labOrder.controller.js
import mongoose from "mongoose";
import {
  createLabOrder,
  getUserLabOrdersOverview,
  getLabOrderDetails,
  getAllLabOrdersOverview,
  updateLabOrderStatusService,
  verifyLabOtpService,
  assignCollectionAgentService,
  uploadPrescriptionService,
  getPrescriptionService,
  deletePrescriptionService,
  uploadLabReportService,
  createRazorpayLabOrderService,
  verifyRazorpayLabPaymentService
} from "../services/labOrder.service.js";
import { cleanupUploadedFile } from "../utils/cleanupUploadedFile.js";

/* ═══════════════════════════════════════════════
   PLACE BOOKING
═══════════════════════════════════════════════ */
export const bookLabOrderController = async (req, res) => {
  try {
    const user = req.user;
    const { labId, items, collectionType, collectionAddress, scheduledAt, paymentMode } = req.body;

    const result = await createLabOrder({
      user,
      userId:            user.id,
      labId,
      items,
      collectionType,
      collectionAddress,
      scheduledAt,
      paymentMode
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("bookLabOrderController:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   USER — OWN ORDERS OVERVIEW
═══════════════════════════════════════════════ */
export const getMyLabOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await getUserLabOrdersOverview({ userId, page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   SINGLE ORDER DETAILS
═══════════════════════════════════════════════ */
export const getLabOrderDetailsController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const requester   = { id: req.user.id, roles: req.user.roles };

    const order = await getLabOrderDetails({ orderId, requester });
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   ADMIN — ALL ORDERS
═══════════════════════════════════════════════ */
export const getAllLabOrdersController = async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      paymentMode,
      collectionType,
      userId,
      labId,
      collectionAgentId,
      fromDate,
      toDate,
      page  = 1,
      limit = 20
    } = req.query;

    const result = await getAllLabOrdersOverview({
      filters: { orderStatus, paymentStatus, paymentMode, collectionType, userId, labId, collectionAgentId, fromDate, toDate },
      page,
      limit
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   UPDATE ORDER STATUS
═══════════════════════════════════════════════ */
export const updateLabOrderStatusController = async (req, res) => {
  try {
    const { orderId }                       = req.params;
    const { newStatus = "", cancelReason = "" } = req.body;

    if (!newStatus) {
      return res.status(400).json({ success: false, message: "newStatus is required" });
    }

    const updated = await updateLabOrderStatusService({
      orderId,
      newStatus,
      cancelReason,
      requester: req.user
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${updated.orderStatus}`,
      data: updated
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   OTP VERIFY (sample collection)
═══════════════════════════════════════════════ */
export const verifyLabOtpController = async (req, res) => {
  try {
    const { orderId, otp } = req.body;

    if (!orderId || !otp) {
      return res.status(400).json({ success: false, message: "orderId and otp are required" });
    }

    const result = await verifyLabOtpService({
      orderId,
      otp,
      requester: { id: req.user._id, roles: req.user.roles }
    });

    return res.status(200).json({ success: true, message: "Sample collection confirmed", data: result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   ASSIGN COLLECTION AGENT
═══════════════════════════════════════════════ */
export const assignCollectionAgentController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId }  = req.body;

    const updated = await assignCollectionAgentService({
      orderId,
      agentUserId: userId,
      requester:   req.user
    });

    return res.status(200).json({
      success: true,
      message: "Collection agent assigned successfully",
      data: updated
    });
  } catch (error) {
    console.error("assignCollectionAgentController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   PRESCRIPTION — UPLOAD
═══════════════════════════════════════════════ */
export const uploadPrescriptionController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Prescription file is required" });
    }

    const result = await uploadPrescriptionService({
      orderId,
      requester: req.user,
      file:      req.file
    });

    return res.status(200).json({ success: true, message: "Prescription uploaded successfully", data: result });
  } catch (error) {
    console.error("uploadPrescriptionController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    await cleanupUploadedFile(req);
  }
};

/* ═══════════════════════════════════════════════
   PRESCRIPTION — VIEW
═══════════════════════════════════════════════ */
export const getPrescriptionController = async (req, res) => {
  try {
    const result = await getPrescriptionService({
      orderId:   req.params.orderId,
      requester: req.user
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 404).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   PRESCRIPTION — DELETE
═══════════════════════════════════════════════ */
export const deletePrescriptionController = async (req, res) => {
  try {
    await deletePrescriptionService({
      orderId:   req.params.orderId,
      requester: req.user
    });
    return res.status(200).json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   REPORT UPLOAD (admin)
═══════════════════════════════════════════════ */
export const uploadLabReportController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Report file is required" });
    }

    const result = await uploadLabReportService({
      orderId,
      requester: req.user,
      file:      req.file
    });

    return res.status(200).json({ success: true, message: "Report uploaded successfully", data: result });
  } catch (error) {
    console.error("uploadLabReportController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    await cleanupUploadedFile(req);
  }
};

/* ═══════════════════════════════════════════════
   RAZORPAY — CREATE
═══════════════════════════════════════════════ */
export const createRazorpayLabOrderController = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const data = await createRazorpayLabOrderService({ orderId, user: req.user });
    return res.status(200).json({ success: true, message: "Razorpay order created", data });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════
   RAZORPAY — VERIFY
═══════════════════════════════════════════════ */
export const verifyRazorpayLabPaymentController = async (req, res, next) => {
  try {
    const result = await verifyRazorpayLabPaymentService(req.body);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

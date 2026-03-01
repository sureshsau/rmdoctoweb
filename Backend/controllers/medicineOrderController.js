import { createMedicineOrder, getAllMedicineOrdersOverview, getMedicineOrderDetails, getOrdersForRmRiderService, getUserMedicineOrdersOverview, updateOrderStatusService, verifyOtpAndUpdateOrderStatus } from "../services/medicineOrder.service.js";
import { createRazorpayMedicineOrderService, verifyRazorpayPaymentService } from "../services/razorpay.js";
import { cleanupUploadedFile } from "../utils/cleanupUploadedFile.js";

import mongoose from "mongoose";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import User from "../models/user.model.js";


export const orderMedicine = async (req, res) => {
  try {
    const user = req.user;

    const {
      items,            // [{ medicineId, quantity }]
      deliveryAddress,  // full address + phone + lat/lng
      paymentMode
    } = req.body;

    const result = await createMedicineOrder({
      user,
      userId: user.id,
      items,
      deliveryAddress,
      paymentMode
    });

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMedicineOrdersOverviewController = async (req, res) => {
  try {

    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await getUserMedicineOrdersOverview({
      userId,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export const getMedicineOrderDetailsController = async (req, res) => {
  try {
    const { orderId } = req.params;

    // requester comes from auth middleware
    const requester = {
      id: req.user.id,
      roles: req.user.roles
    };

    const order = await getMedicineOrderDetails({
      orderId,
      requester
    });

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};


export const verifyOrderOtpController = async (req, res) => {
  try {
    const { orderId, otp } = req.body;

    if (!orderId || !otp) {
      return res.status(400).json({
        success: false,
        message: "orderId and otp are required"
      });
    }

    const requester = {
      id: req.user._id,
      roles: req.user.roles
    };

    const result = await verifyOtpAndUpdateOrderStatus({
      orderId,
      otp,
      requester
    });

    return res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      data: result
    });

  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateOrderStatusController = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { newStatus="", cancelReason="", enteredOtp } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "New status is required"
      });
    }

    const updatedOrder = await updateOrderStatusService({
      orderId,
      newStatus,
      marketingAgentUserId: req.user.id,
      cancelReason,
      enteredOtp,
      requester:req.user
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${updatedOrder.orderStatus}`,
      data: updatedOrder
    });

  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};



export const getAllMedicineOrdersController = async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      paymentMode,
      userId,
      deliveryAgentId,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      orderStatus,
      paymentStatus,
      paymentMode,
      userId,
      deliveryAgentId,
      fromDate,
      toDate
    };

    const result = await getAllMedicineOrdersOverview({
      filters,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const createRazorpayMedicineOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    const data = await createRazorpayMedicineOrderService({
      orderId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOnlinePaymentController = async (req, res, next) => {
  try {
    const result = await verifyRazorpayPaymentService(req.body);

    res.status(200).json({
      success: true,
      result
    });
  } catch (err) {
    next(err);
  }
};



export const assignRMRiderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body;
    console.log("Assign RM Rider - orderId:", orderId, "userId:", userId);

    // ----------- ROLE CHECK -----------
    const allowedRoles = ["admin", "subadmin", "receptionist"];

    const hasAccess = req.user.roles?.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to assign RM Rider"
      });
    }

    // ----------- VALIDATION -----------
    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid orderId or userId"
      });
    }

    // ----------- CHECK USER IS RM RIDER -----------
    const rider = await User.findOne({
      _id: userId,
      roles: { $in: ["rmrider"] },
      isActive: true,
      isBlocked: false
    });

    if (!rider) {
      return res.status(400).json({
        success: false,
        message: "User is not a valid RM Rider"
      });
    }

    // ----------- UPDATE ORDER -----------
    const updatedOrder = await MedicineOrder.findByIdAndUpdate(
      orderId,
      {
        deliveryAgentId: userId
      },
      { new: true }
    ).populate("deliveryAgentId", "name phone");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "RM Rider assigned successfully",
      data: updatedOrder
    });

  } catch (error) {
    console.error("Assign RM Rider Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};


export const getAssignedOrdersForRider = async (req, res, next) => {
  try {
    const id = req.user.id;

    const {
      status,
      page = 1,
      limit = 10
    } = req.query;

    const result = await getOrdersForRmRiderService({
      rmRiderUserId: id,
      status,
      page: Number(page),
      limit: Number(limit)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.log("getAssignedOrdersForRider Error:", error);
    next(error);
  }
};
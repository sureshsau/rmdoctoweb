import { createMedicineOrder, getAllMedicineOrdersOverview, getMedicineOrderDetails, getUserMedicineOrdersOverview, verifyOtpAndUpdateOrderStatus } from "../services/medicineOrder.service.js";
import { createRazorpayMedicineOrderService, verifyRazorpayPaymentService } from "../services/razorpay.js";



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
    // userId always from auth middleware
    const userId = req.user.id;

    const orders = await getUserMedicineOrdersOverview({ userId });

    return res.status(200).json({
      success: true,
      data: orders
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


export const getAllMedicineOrdersController = async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      paymentMode,
      deliveryStatus,
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
      deliveryStatus,
      userId,
      deliveryAgentId,
      fromDate,
      toDate
    };

    // remove undefined filters
    Object.keys(filters).forEach(
      key => filters[key] === undefined && delete filters[key]
    );

    const orders = await getAllMedicineOrdersOverview({
      filters,
      page: Number(page),
      limit: Number(limit)
    });

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    return res.status(400).json({
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

import express from 'express';
import { authenticate } from '../middlewares/auth.middlewire.js';
import { createMedicineOrderMiddleware } from '../validator/medicine/medicineOrder.validator.js';
import {
  assignRMRiderController,
  createRazorpayMedicineOrder,
  getAllMedicineOrdersController,
  getAssignedOrdersForRider,
  getMedicineOrderDetailsController,
  getMedicineOrdersOverviewController,
  orderMedicine,
  updateOrderStatusController,
  verifyOnlinePaymentController,
  verifyOrderOtpController
} from '../controllers/medicineOrderController.js';

const router = express.Router();

// ---------- STATIC ROUTES FIRST ----------
router.get("/rider", authenticate, getAssignedOrdersForRider);
router.get("/view/all", authenticate, getAllMedicineOrdersController);

router.post("/verify-otp", authenticate, verifyOrderOtpController);
router.post("/payments/razorpay/create", authenticate, createRazorpayMedicineOrder);
router.post("/payments/razorpay/verify", authenticate, verifyOnlinePaymentController);

router.patch("/assign-rmrider/:orderId", authenticate, assignRMRiderController);
router.patch("/:orderId/status", authenticate, updateOrderStatusController);

// ---------- MAIN ROUTES ----------
router.post("/", authenticate, createMedicineOrderMiddleware, orderMedicine);
router.get("/", authenticate, getMedicineOrdersOverviewController);

// ---------- DYNAMIC ROUTE ALWAYS LAST ----------

// ---------- DYNAMIC ROUTE ALWAYS LAST ----------
router.get("/:orderId", authenticate, getMedicineOrderDetailsController);

export default router;
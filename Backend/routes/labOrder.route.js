import express from "express";
import { authenticate, authorize, isAdminOrSubadmin } from "../middlewares/auth.middlewire.js";
import { prescriptionUpload } from "../utils/prescriptionUpload.js";
import {
  bookLabOrderController,
  getMyLabOrdersController,
  getLabOrderDetailsController,
  getAllLabOrdersController,
  updateLabOrderStatusController,
  verifyLabOtpController,
  assignCollectionAgentController,
  uploadPrescriptionController,
  getPrescriptionController,
  deletePrescriptionController,
  uploadLabReportController,
  createRazorpayLabOrderController,
  verifyRazorpayLabPaymentController,
  getAssignedLabOrdersForRiderController
} from "../controllers/labOrder.controller.js";

const router = express.Router();

/* ═════════════════════════════════════════
   STATIC ROUTES FIRST
═════════════════════════════════════════ */

// Admin: view all lab orders (with filters)
// GET /lab/order/view/all?orderStatus=CONFIRMED&labId=...
router.get(
  "/view/all",
  authenticate,
  authorize("labOrder.read.all"),
  getAllLabOrdersController
);

// Rider: view assigned lab orders
// GET /lab/order/rider
router.get(
  "/rider",
  authenticate,
  authorize("labOrder.read.rider"),
  getAssignedLabOrdersForRiderController
);

// OTP verify for sample collection
// POST /lab/order/verify-otp
router.post("/verify-otp", authenticate, verifyLabOtpController);

// Razorpay
// POST /lab/order/payments/razorpay/create
router.post("/payments/razorpay/create", authenticate, createRazorpayLabOrderController);
// POST /lab/order/payments/razorpay/verify
router.post("/payments/razorpay/verify", authenticate, verifyRazorpayLabPaymentController);

// Assign collection agent (rmrider) to order
// PATCH /lab/order/assign-collector/:orderId
router.patch(
  "/assign-collector/:orderId",
  authenticate,
  authorize("labOrder.assign.collector"),
  assignCollectionAgentController
);

// Update order status (admin)
// PATCH /lab/order/:orderId/status
router.patch(
  "/:orderId/status",
  authenticate,
  authorize("labOrder.status.update"),
  updateLabOrderStatusController
);

/* ═════════════════════════════════════════
   MAIN ROUTES
═════════════════════════════════════════ */

// Place a lab booking (user / agent)
// POST /lab/order
router.post("/", authenticate, bookLabOrderController);

// User's own orders overview
// GET /lab/order
router.get("/", authenticate, getMyLabOrdersController);

/* ═════════════════════════════════════════
   DYNAMIC ROUTES ALWAYS LAST
═════════════════════════════════════════ */

// Upload report (admin — PDF or image)
// POST /lab/order/:orderId/report
router.post(
  "/:orderId/report",
  authenticate,
  authorize("labOrder.report.upload"),
  prescriptionUpload.single("report"),    // reuse same multer (pdf+image)
  uploadLabReportController
);

// Prescription — upload (order owner only)
// POST /lab/order/:orderId/prescription
router.post(
  "/:orderId/prescription",
  authenticate,
  prescriptionUpload.single("prescription"),
  uploadPrescriptionController
);

// Prescription — view (owner + admin)
// GET /lab/order/:orderId/prescription
router.get("/:orderId/prescription", authenticate, getPrescriptionController);

// Prescription — delete (owner only, before SAMPLE_COLLECTED)
// DELETE /lab/order/:orderId/prescription
router.delete("/:orderId/prescription", authenticate, deletePrescriptionController);

// Single order details (owner + admin)
// GET /lab/order/:orderId
router.get("/:orderId", authenticate, getLabOrderDetailsController);

export default router;

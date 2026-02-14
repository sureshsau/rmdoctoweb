import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { createMedicineOrderMiddleware } from '../validator/medicine/medicineOrder.validator.js';
import { createRazorpayMedicineOrder, getAllMedicineOrdersController, getMedicineOrderDetailsController, getMedicineOrdersOverviewController, orderMedicine, updateOrderStatusController, verifyOnlinePaymentController, verifyOrderOtpController } from '../controllers/medicineOrderController.js';
const router=express.Router();


router.post(
  "/",
  authenticate,
  createMedicineOrderMiddleware,
  orderMedicine
)
.get("/",authenticate,getMedicineOrdersOverviewController)
.get("/:orderId",authenticate,getMedicineOrderDetailsController)
.post(
  "/verify-otp",
  authenticate,
  verifyOrderOtpController
)
.post(
  "/payments/razorpay/create",
  authenticate,
  createRazorpayMedicineOrder
)
.post(
  "/payments/razorpay/verify",
  authenticate,
  verifyOnlinePaymentController
)
.patch(
  "/:orderId/status",
  authenticate,
  updateOrderStatusController
)

.get("/view/all",authenticate,authorize("medicineOrder.view.all"),getAllMedicineOrdersController)

export default router

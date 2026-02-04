import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { createMedicineOrderMiddleware } from '../validator/medicine/medicineOrder.validator.js';
import { getAllMedicineOrdersController, getMedicineOrderDetailsController, getMedicineOrdersOverviewController, orderMedicine, verifyOrderOtpController } from '../controllers/medicineOrderController.js';
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
.get("/view/all",authenticate,authorize("medicineOrder.view.all"),getAllMedicineOrdersController)

export default router

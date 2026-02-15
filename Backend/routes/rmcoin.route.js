import express from "express";
import { authenticate, isAdmin } from "../middlewares/auth.middlewire.js";
import { adminRechargeController, adminTransferToUserController, getAdminRMCoinsLogsController,  getUserRMCoinsLogsController, userTransferToAdminController } from "../controllers/rmcoin.controller.js";

const router = express.Router();




router.post(
  "/transfer-to-admin",
  authenticate,
  userTransferToAdminController
)
.post(
  "/admin-transfer",
  authenticate,
  isAdmin,
  adminTransferToUserController
)

.post(
  "/admin/recharge",
  authenticate,
  isAdmin,
  adminRechargeController
)
.get(
    '/admin/logs',
    authenticate,
    isAdmin,
    getAdminRMCoinsLogsController
)
.get(
    '/logs/me',
    authenticate,
    getUserRMCoinsLogsController
)

export default router;

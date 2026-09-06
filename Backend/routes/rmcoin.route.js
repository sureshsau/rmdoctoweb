import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import { idempotency } from "../middlewares/idempotency.middleware.js";
import { adminRechargeController, adminTransferToUserController, getAdminRMCoinsLogsController, getUserRMCoinsLogsController, userTransferToAdminController } from "../controllers/rmcoin.controller.js";

const router = express.Router();

// User transfers RM Coins to admin
router.post(
  '/transfer-to-admin',
  authenticate,
  idempotency(),
  userTransferToAdminController
);

// Admin transfers RM Coins to user
router.post(
  '/admin-transfer',
  authenticate,
  authorize('rmcoin.transfer.toUser'),
  idempotency(),
  adminTransferToUserController
);

// Admin recharges RM Coins pool
router.post(
  '/admin/recharge',
  authenticate,
  authorize('rmcoin.recharge'),
  idempotency(),
  adminRechargeController
);

// Admin view RM Coin transaction logs
router.get(
  '/admin/logs',
  authenticate,
  authorize('rmcoin.logs.admin'),
  getAdminRMCoinsLogsController
);

// User view own RM Coin logs
router.get(
  '/logs/me',
  authenticate,
  getUserRMCoinsLogsController
);

export default router;

import express from "express";
import {
  addCreditController,
  getAgentCreditDetailsController,
  getMyCreditDetailsController,
  requestRevokeCreditController,
  verifyRevokeCreditController,
  getAdminCreditHistoryController,
  createRepaymentOrderController,
  verifyRepaymentController,
  recordOfflineRepaymentController,
} from "../controllers/rmcredit.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import { idempotency } from "../middlewares/idempotency.middleware.js";

const router = express.Router();

// Add credit to agent (admin)
router.post('/', authenticate, authorize('rmcredit.add'), idempotency(), addCreditController);

// Request credit revoke (admin)
router.post('/revoke/request', authenticate, authorize('rmcredit.revoke.request'), idempotency(), requestRevokeCreditController);

// Verify / confirm credit revoke (admin)
router.post('/revoke/verify', authenticate, authorize('rmcredit.revoke.verify'), idempotency(), verifyRevokeCreditController);

// Agent pays back used credit online (self-service, no special permission --
// same "must own the wallet" rule the checkout-time RM_CREDIT spend uses)
router.post('/repay/online/create', authenticate, idempotency(), createRepaymentOrderController);
router.post('/repay/online/verify', authenticate, idempotency(), verifyRepaymentController);

// Admin records an offline (cash) repayment
router.post('/repay/offline', authenticate, authorize('rmcredit.repay.offline'), idempotency(), recordOfflineRepaymentController);

// View own credit details
router.get('/my', authenticate, getMyCreditDetailsController);

// View admin credit history (admin)
router.get('/history', authenticate, authorize('rmcredit.read.history'), getAdminCreditHistoryController);

// View specific agent credit details (admin)
router.get('/admin/:agentId', authenticate, authorize('rmcredit.read.agent'), getAgentCreditDetailsController);

export default router;

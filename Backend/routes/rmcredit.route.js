import express from "express";
import { addCreditController, getAgentCreditDetailsController, getMyCreditDetailsController, requestRevokeCreditController, verifyRevokeCreditController, getAdminCreditHistoryController } from "../controllers/rmcredit.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";

const router = express.Router();

// Add credit to agent (admin)
router.post('/', authenticate, authorize('rmcredit.add'), addCreditController);

// Request credit revoke (admin)
router.post('/revoke/request', authenticate, authorize('rmcredit.revoke.request'), requestRevokeCreditController);

// Verify / confirm credit revoke (admin)
router.post('/revoke/verify', authenticate, authorize('rmcredit.revoke.verify'), verifyRevokeCreditController);

// View own credit details
router.get('/my', authenticate, getMyCreditDetailsController);

// View admin credit history (admin)
router.get('/history', authenticate, authorize('rmcredit.read.history'), getAdminCreditHistoryController);

// View specific agent credit details (admin)
router.get('/admin/:agentId', authenticate, authorize('rmcredit.read.agent'), getAgentCreditDetailsController);

export default router;

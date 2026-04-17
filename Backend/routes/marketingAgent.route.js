import express from 'express';
import { authenticate } from '../middlewares/auth.middlewire.js';
import { getAssignedOrders, marketingAgentNetworkController, registerAgentByMarketingAgentController } from '../controllers/marketingAgentController.js';

const router = express.Router();

// ── ROLE-INTERNAL (controller enforces 'marketing_agent' role) ───────────────
// Register agent via marketing agent
router.post('/register/agent', authenticate, registerAgentByMarketingAgentController);

// View marketing agent network
router.get('/network', authenticate, marketingAgentNetworkController);

// View medicine orders assigned to marketing agent
router.get('/medicine/orders', authenticate, getAssignedOrders);

export default router;
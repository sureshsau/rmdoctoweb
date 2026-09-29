import express from 'express';
import { authenticate } from '../middlewares/auth.middlewire.js';
import { getAssignedOrders, blockCoordinatorNetworkController, registerCommunityPartnerByBlockCoordinatorController } from '../controllers/blockCoordinator.controller.js';

const router = express.Router();

// ── ROLE-INTERNAL (controller enforces 'block_coordinator' role) ───────────────
// Register community_partner via marketing community_partner
router.post('/register/community_partner', authenticate, registerCommunityPartnerByBlockCoordinatorController);

// View marketing community_partner network
router.get('/network', authenticate, blockCoordinatorNetworkController);

// View medicine orders assigned to marketing community_partner
router.get('/medicine/orders', authenticate, getAssignedOrders);

export default router;
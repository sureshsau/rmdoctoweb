import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { agetNetworkController, registerCommunityPartnerController, uploadAgreementEnsureProfileController } from '../controllers/communityPartner.controller.js';
import { upload } from '../utils/multer.js';

const router = express.Router();

// ── SELF-SERVICE (community_partner's own actions — controller enforces 'community_partner' role) ─────
// CommunityPartner views their own network
router.get('/network', authenticate, agetNetworkController);

// CommunityPartner uploads their own agreement document
router.post('/agreement/upload', authenticate, upload.single('file'), uploadAgreementEnsureProfileController);

// ── ADMIN / PERMISSION-GATED ──────────────────────────────────────────────────
// Only admin/subadmin can register a new community_partner
router.post('/register', authenticate, authorize('community_partner.create'), registerCommunityPartnerController);

export default router;

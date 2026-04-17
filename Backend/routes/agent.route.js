import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { agetNetworkController, registerAgentController, uploadAgreementEnsureProfileController } from '../controllers/agent.controller.js';
import { upload } from '../utils/multer.js';

const router = express.Router();

// ── SELF-SERVICE (agent's own actions — controller enforces 'agent' role) ─────
// Agent views their own network
router.get('/network', authenticate, agetNetworkController);

// Agent uploads their own agreement document
router.post('/agreement/upload', authenticate, upload.single('file'), uploadAgreementEnsureProfileController);

// ── ADMIN / PERMISSION-GATED ──────────────────────────────────────────────────
// Only admin/subadmin can register a new agent
router.post('/register', authenticate, authorize('agent.create'), registerAgentController);

export default router;

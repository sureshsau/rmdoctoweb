import express from 'express';
import { getPermissionsController } from '../controllers/permission.controller.js';
import { authenticate, isAdminOrSubadmin } from '../middlewares/auth.middlewire.js';

const router = express.Router();

// ── ADMIN / SUBADMIN ONLY ─────────────────────────────────────────────────────
// Get full permissions list — no granular permission needed, role check is enough
router.get('/', authenticate, isAdminOrSubadmin, getPermissionsController);

export default router;
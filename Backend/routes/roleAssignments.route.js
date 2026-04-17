import express from 'express';
import { assignRole } from '../controllers/roleAssignments.controller.js';
import { authenticate, isAdminOrSubadmin } from '../middlewares/auth.middlewire.js';

const router = express.Router();

// ── ADMIN / SUBADMIN ONLY ─────────────────────────────────────────────────────
// Assign a role to a user — admin-only action, no granular permission needed
router.post('/assign', authenticate, isAdminOrSubadmin, assignRole);

export default router;
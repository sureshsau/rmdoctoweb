import express from 'express';
import { createRole, getAllRolesController } from '../controllers/roles.controller.js';
import { authenticate, isAdminOrSubadmin } from '../middlewares/auth.middlewire.js';

const router = express.Router();

// ── ADMIN / SUBADMIN ONLY ─────────────────────────────────────────────────────
// View all roles
router.get('/', authenticate, isAdminOrSubadmin, getAllRolesController);

// Create a new role
router.post('/', authenticate, isAdminOrSubadmin, createRole);

export default router;
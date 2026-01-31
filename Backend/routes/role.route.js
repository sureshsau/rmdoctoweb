import express from 'express';
import { createRole, getAllRolesController } from '../controllers/roles.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';

const router=express.Router();

router
    .get('/',authenticate,authorize(),getAllRolesController)
    .post('/',authenticate,authorize(),createRole)

export default router;
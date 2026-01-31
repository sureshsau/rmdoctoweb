import express from 'express';
import { getPermissionsController } from '../controllers/permission.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';

const router=express.Router();

    router
        .get('/',authenticate,authorize("permissions:get"),getPermissionsController)


export default router
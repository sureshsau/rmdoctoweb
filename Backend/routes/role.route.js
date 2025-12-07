import express from 'express';
import { createRole, getAllRolesController } from '../controllers/roles.controller.js';

const router=express.Router();

router
    .get('/',getAllRolesController)
    .post('/',createRole)

export default router;
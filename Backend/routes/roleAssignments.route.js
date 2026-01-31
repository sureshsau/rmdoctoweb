import express from 'express';
import {assignRole} from '../controllers/roleAssignments.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';

const router=express.Router();
router
    .post('/assign',authenticate,authorize(),assignRole);


export default router;
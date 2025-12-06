import express from 'express';
import { createRole } from '../controllers/roles.controller.js';

const router=express.Router();

router
    .post('/',createRole)

export default router;
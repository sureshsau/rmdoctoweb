import express from 'express';
import { getPermissionsController } from '../controllers/permission.controller.js';

const router=express.Router();

    router
        .get('/',getPermissionsController)


export default router
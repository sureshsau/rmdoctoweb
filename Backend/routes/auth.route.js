
import { getAllUserController } from "../controllers/user.controller.js";
import express from 'express';

const router=express.Router();

router
    .get('/',getAllUserController)

export default router;
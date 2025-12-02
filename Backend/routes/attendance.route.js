import express from 'express'
import { authenticate } from '../middlewires/auth.middlewire.js';

const router=express.Router();

router
    .post('/checkIn',authenticate)


export default router
import express from 'express'
import { authenticate } from '../middlewares/auth.middlewire.js';
import { registerAgentController } from '../controllers/agent.controller.js';

const router=express.Router();

router
    .post('/register',
        authenticate,
        registerAgentController
    )



export default router
import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { marketingAgentNetworkController, registerAgentByMarketingAgentController } from '../controllers/marketingAgentController.js';

const router=express.Router();


router
    .post('/register/agent',
        authenticate,
        authorize("agent.create"),
        registerAgentByMarketingAgentController
    )
    .get("/network",
        authenticate,
        marketingAgentNetworkController
    )


export default router
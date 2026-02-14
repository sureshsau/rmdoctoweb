import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { getAssignedOrders, marketingAgentNetworkController, registerAgentByMarketingAgentController } from '../controllers/marketingAgentController.js';

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
    .get(
    "/medicine/orders",
    authenticate,
    getAssignedOrders
    )



export default router
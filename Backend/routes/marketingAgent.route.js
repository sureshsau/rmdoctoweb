import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { getAssignedOrders, marketingAgentNetworkController, registerAgentByMarketingAgentController, updateOrderStatusController } from '../controllers/marketingAgentController.js';

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

    .patch(
  "/medicine/orders/:orderId/status",
  authenticate,
  updateOrderStatusController
);


export default router
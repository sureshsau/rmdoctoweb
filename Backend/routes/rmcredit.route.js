import express from "express";
import { addCreditController, getAgentCreditDetailsController, getMyCreditDetailsController, requestRevokeCreditController, verifyRevokeCreditController } from "../controllers/rmcredit.controller.js";
import { authenticate, isAdmin } from "../middlewares/auth.middlewire.js";

const router = express.Router();

router.post("/", authenticate, isAdmin, addCreditController)
.post("/revoke/request",authenticate, isAdmin, requestRevokeCreditController)
.post("/revoke/verify",authenticate, isAdmin, verifyRevokeCreditController)
.get("/my", authenticate, getMyCreditDetailsController);
router.get("/admin/:agentId", authenticate, isAdmin, getAgentCreditDetailsController);


export default router;

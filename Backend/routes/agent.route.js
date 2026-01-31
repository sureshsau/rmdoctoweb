import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import { registerAgentController } from "../controllers/agent.controller.js";

const router = express.Router();

router.post(
  "/register",
  authenticate,
  authorize("agent.create"),
  registerAgentController
);

export default router;

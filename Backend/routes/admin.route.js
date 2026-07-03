import express from "express";
import { authenticate, isAdmin } from "../middlewares/auth.middlewire.js";
import {
  adminGetAgentNetworkController,
  adminGetMarketingAgentNetworkController,
  adminGetAllAgentsController,
  adminGetAllMarketingAgentsController,
  registerAgentByAdminController
} from "../controllers/admin.network.controller.js";
import { getAnalyticsReport } from "../controllers/admin.analytics.controller.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// ── REGISTER ────────────────────────────────────────────────────
// Register a new root agent
router.post("/register-agent", registerAgentByAdminController);

// ── ANALYTICS ───────────────────────────────────────────────────
router.get("/analytics", getAnalyticsReport);

// ── PICK LISTS ──────────────────────────────────────────────────
// List all agents (for the selection screen)
router.get("/network/agents", adminGetAllAgentsController);

// List all marketing agents (for the selection screen)
router.get("/network/marketing-agents", adminGetAllMarketingAgentsController);

// ── SPECIFIC NETWORK TREES ──────────────────────────────────────
// View a specific agent's full downline tree
router.get("/network/agent/:userId", adminGetAgentNetworkController);

// View a specific marketing agent's full downline tree
router.get("/network/marketing-agent/:userId", adminGetMarketingAgentNetworkController);

export default router;

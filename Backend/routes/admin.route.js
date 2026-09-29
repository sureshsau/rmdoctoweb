import express from "express";
import { authenticate, isAdmin } from "../middlewares/auth.middlewire.js";
import {
  adminGetCommunityPartnerNetworkController,
  adminGetBlockCoordinatorNetworkController,
  adminGetAllCommunityPartnersController,
  adminGetAllBlockCoordinatorsController,
  registerCommunityPartnerByAdminController
} from "../controllers/admin.network.controller.js";
import { getAnalyticsReport } from "../controllers/admin.analytics.controller.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// ── REGISTER ────────────────────────────────────────────────────
// Register a new root community_partner
router.post("/register-community_partner", registerCommunityPartnerByAdminController);

// ── ANALYTICS ───────────────────────────────────────────────────
router.get("/analytics", getAnalyticsReport);

// ── PICK LISTS ──────────────────────────────────────────────────
// List all community_partners (for the selection screen)
router.get("/network/community_partners", adminGetAllCommunityPartnersController);

// List all marketing community_partners (for the selection screen)
router.get("/network/marketing-community_partners", adminGetAllBlockCoordinatorsController);

// ── SPECIFIC NETWORK TREES ──────────────────────────────────────
// View a specific community_partner's full downline tree
router.get("/network/community_partner/:userId", adminGetCommunityPartnerNetworkController);

// View a specific marketing community_partner's full downline tree
router.get("/network/marketing-community_partner/:userId", adminGetBlockCoordinatorNetworkController);

export default router;

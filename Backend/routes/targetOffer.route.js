import express from "express";
import { 
  createTarget, 
  getAllTargets, 
  updateTarget, 
  deleteTarget, 
  getCommunityPartnerTargetProgress,
  getMyTargetProgress
} from "../controllers/targetOffer.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";

const router = express.Router();

// Community Partner routes
router.get("/my-progress", authenticate, getMyTargetProgress);

// Admin routes
router.get("/", authenticate, authorize("Manage Target Offers"), getAllTargets);
router.get("/progress", authenticate, authorize("Manage Target Offers"), getCommunityPartnerTargetProgress);
router.post("/", authenticate, authorize("Manage Target Offers"), createTarget);
router.put("/:id", authenticate, authorize("Manage Target Offers"), updateTarget);
router.delete("/:id", authenticate, authorize("Manage Target Offers"), deleteTarget);

export default router;

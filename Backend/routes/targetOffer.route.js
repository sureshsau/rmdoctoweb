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
import { upload } from "../utils/multer.js";
import { handleUpload } from "../utils/handleUpload.js";

const router = express.Router();

// Community Partner routes
router.get("/my-progress", authenticate, getMyTargetProgress);

// Admin routes
router.get("/", authenticate, authorize("Manage Target Offers"), getAllTargets);
router.get("/progress", authenticate, authorize("Manage Target Offers"), getCommunityPartnerTargetProgress);
router.post("/", authenticate, authorize("Manage Target Offers"), handleUpload(upload.single("bannerImage")), createTarget);
router.put("/:id", authenticate, authorize("Manage Target Offers"), handleUpload(upload.single("bannerImage")), updateTarget);
router.delete("/:id", authenticate, authorize("Manage Target Offers"), deleteTarget);

export default router;

import express from "express";

import {
  deleteVisitController,
  getVisitLocationsController,
  getVisitPlanController,
  getVisitSummaryController,
  getVisitTrackController,
  markVisitController,
  updateShopDetailsController,
} from "../controllers/visit.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

/* Admin / subadmin / employee pass every guard (see authorize), so these
   permissions are really about which marketing executives get in. The service
   layer then scopes a marketing executive to their own allocation. */

// ── READ ─────────────────────────────────────────────────────────────────────
router.get("/plan", authenticate, authorize("visit.read"), getVisitPlanController);
router.get("/summary", authenticate, authorize("visit.read"), getVisitSummaryController);
router.get("/locations", authenticate, authorize("visit.read"), getVisitLocationsController);
router.get(
  "/member/:agentProfileId",
  authenticate,
  authorize("visit.read"),
  getVisitTrackController
);

// ── WRITE ────────────────────────────────────────────────────────────────────
// Optional `photo` field lets the executive attach on-the-spot proof
router.post(
  "/member/:agentProfileId",
  authenticate,
  authorize("visit.mark"),
  upload.single("photo"),
  markVisitController
);

router.patch(
  "/member/:agentProfileId/shop",
  authenticate,
  authorize("visit.mark"),
  upload.single("image"),
  updateShopDetailsController
);

router.delete("/:visitId", authenticate, authorize("visit.mark"), deleteVisitController);

export default router;

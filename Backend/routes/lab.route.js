import express from "express";
import { authenticate, authorize, isAdminOrSubadmin } from "../middlewares/auth.middlewire.js";
import { upload } from "../utils/multer.js";
import {
  createLabController,
  getLabsController,
  getLabByIdController,
  updateLabController,
  deleteLabController,
  createLabTestController,
  getLabTestsController,
  getLabTestByIdController,
  updateLabTestController,
  deleteLabTestController
} from "../controllers/lab.controller.js";

const router = express.Router();

/* ═════════════════════════════════════════
   LAB ROUTES
═════════════════════════════════════════ */

// Create lab (admin/subadmin, with image upload)
router.post(
  "/",
  authenticate,
  authorize("lab.create"),
  upload.array("images", 5),
  createLabController
);

// List all labs (public)
router.get("/", getLabsController);

// Get single lab (public)
router.get("/:labId", getLabByIdController);

// Update lab (admin/subadmin)
router.put(
  "/:labId",
  authenticate,
  authorize("lab.update"),
  updateLabController
);

// Soft delete lab (admin/subadmin)
router.delete(
  "/:labId",
  authenticate,
  authorize("lab.delete"),
  deleteLabController
);

/* ═════════════════════════════════════════
   LAB TEST ROUTES  (/labs/tests/...)
═════════════════════════════════════════ */

// Create lab test (admin/subadmin)
router.post(
  "/tests/create",
  authenticate,
  authorize("labTest.create"),
  createLabTestController
);

// List all lab tests (public, filter by labId / category / sampleType)
router.get("/tests/list", getLabTestsController);

// Get single lab test (public)
router.get("/tests/:testId", getLabTestByIdController);

// Update lab test (admin/subadmin)
router.put(
  "/tests/:testId",
  authenticate,
  authorize("labTest.update"),
  updateLabTestController
);

// Delete lab test (admin/subadmin)
router.delete(
  "/tests/:testId",
  authenticate,
  authorize("labTest.delete"),
  deleteLabTestController
);

export default router;

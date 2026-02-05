import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import { agetNetworkController, registerAgentController, uploadAgreementEnsureProfileController } from "../controllers/agent.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

router.post(
  "/register",
  authenticate,
  authorize("agent.create"),
  registerAgentController
)
router.get(
  "/myNetwok",
  authenticate,
  agetNetworkController
)
.post(
  "/agreement/upload",
  authenticate,
  authorize("agent.agreement.upload"),
  upload.single("file"),
  uploadAgreementEnsureProfileController
);

export default router;

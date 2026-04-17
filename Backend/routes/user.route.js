import express from "express";
import multer from "multer";
import { 
  createUserController, 
  getAllDoctorsController, 
  getAllRMRidersController, 
  getAllUserController, 
  uploadProfilePictureController,
  getMyAddressesController,
  addMyAddressController,
  deleteMyAddressController
} from "../controllers/user.controller.js";
import { authenticate, authorize, isOwnerOrAdmin } from "../middlewares/auth.middlewire.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// ── SELF-SERVICE (any logged-in user, accessing only their own data) ──────────
router.get('/my/addresses', authenticate, getMyAddressesController);
router.post('/my/addresses', authenticate, addMyAddressController);
router.delete('/my/addresses/:addressId', authenticate, deleteMyAddressController);

// ── OPEN TO ALL AUTHENTICATED USERS ──────────────────────────────────────────
router.get("/doctors", authenticate, getAllDoctorsController);
router.get("/rmriders", authenticate, getAllRMRidersController);

// ── OWNER OR ADMIN (profile picture — only own or admin can upload) ───────────
router.post("/:userId/profile-picture", authenticate, isOwnerOrAdmin("userId"), upload.single("image"), uploadProfilePictureController);

// ── ADMIN / PERMISSION-GATED ──────────────────────────────────────────────────
router.get("/", authenticate, authorize("user.read.all"), getAllUserController);
router.post("/", authenticate, authorize("user.create"), createUserController);

export default router;

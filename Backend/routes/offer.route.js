import express from "express";
import { 
  createOffer, 
  getAllOffers, 
  updateOffer, 
  deleteOffer, 
  validateAndApplyOffer,
  getOfferSuggestions 
} from "../controllers/offer.controller.js";
import { authenticate } from "../middlewares/auth.middlewire.js";
import { authorize } from "../middlewares/auth.middlewire.js";

const router = express.Router();

// Public / User routes
router.get("/", getAllOffers);
router.get("/suggestions", getOfferSuggestions);
router.post("/validate", authenticate, validateAndApplyOffer);

// Admin routes
router.post("/", authenticate, authorize("Manage Offers"), createOffer);
router.put("/:id", authenticate, authorize("Manage Offers"), updateOffer);
router.delete("/:id", authenticate, authorize("Manage Offers"), deleteOffer);

export default router;

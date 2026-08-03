import express from "express";

import { authenticate, isAdmin } from "../middlewares/auth.middlewire.js";
import {
  GetAllNotification,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  sendNotificationController,
  getSentNotificationsController,
  getTargetableRolesController,
  registerDeviceTokenController,
  removeDeviceTokenController,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Every notification route needs a logged-in user.
router.use(authenticate);

/* ================= ADMIN ONLY =================
   Declared before the ":id" routes so "sent" / "roles" are not swallowed by
   the parameterised paths. */

router.post("/send", isAdmin, sendNotificationController);
router.get("/sent", isAdmin, getSentNotificationsController);
router.get("/roles", isAdmin, getTargetableRolesController);

/* ================= DEVICE TOKENS ================= */

router.post("/device-token", registerDeviceTokenController);
router.delete("/device-token", removeDeviceTokenController);

/* ================= ANY AUTHENTICATED USER ================= */

router.get("/", GetAllNotification);
router.get("/unread-count", getUnreadCountController);
router.patch("/read-all", markAllAsReadController);
router.patch("/:id/read", markAsReadController);
router.delete("/:id", deleteNotificationController);

export default router;

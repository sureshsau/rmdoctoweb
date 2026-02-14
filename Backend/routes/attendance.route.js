import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import {
  getAttendanceSettingsController,
  registerFaceEmbeddingController,
  setAttendanceSettingsForAllUsersController,
  setupUserAttendanceController,
  markAttendanceByFaceController,
  getMyAttendanceLogsController,
  getAttendanceLogsForUserController
} from "../controllers/attendance.controller.js";
import { upload } from "../utils/multer.js";
import { attendanceSettingsValidationRules, parseAttendancePayload, validateAttendanceSettings } from "../validator/attendance/attendanceSettings.validator.js";


const router = express.Router();

  router.post(
  "/setup/:userId",
  authenticate,
  authorize(["Attendance.settings:create"]),
  upload.single("faceImage"),          // 1️⃣ parses body
  parseAttendancePayload,
  attendanceSettingsValidationRules,   // 2️⃣ run validators
  validateAttendanceSettings,          // 3️⃣ read results
  setupUserAttendanceController
);


  // mark attendance
  router.post(
    "/mark",
    authenticate,
    upload.single("faceImage"),
    markAttendanceByFaceController
  );

  // Get own attendance logs
  router.get(
    "/log/me",
    authenticate,
    getMyAttendanceLogsController
  );

  // Get user's attendance logs (admin only)
  router.get(
    "/log/:userId",
    authenticate,
    getAttendanceLogsForUserController
  );

  router.get(
    '/settings',
    authenticate,
    authorize(
      "Attendance.settings:view:self",
      "Attendance.settings:view:all"
    ),
    getAttendanceSettingsController
  );

  router.post(
    "/setAttendanceSettings",
    authenticate,
    authorize("attendance.settings.update"),
    setAttendanceSettingsForAllUsersController
  );

export default router;

import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import {
  getAttendanceSettingsController,
  registerFaceEmbeddingController,
  setAttendanceSettingsForAllUsersController,
  getMyAttendanceThisMonthController,
  getAttendanceByRangeController,
  setupUserAttendanceController,
  markAttendanceByFaceController
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


  //mark attendence
      router.post(
            "/mark",
            authenticate,
            authorize(["Attendance:mark"]),
            upload.single("faceImage"),
            markAttendanceByFaceController
      )

  .get('/settings',
        authenticate,
        authorize([
          "Attendance.settings:view:self",
          "Attendance.settings:view:all"
        ]),
        getAttendanceSettingsController)

  .post('/setAttendanceSettings',
        authenticate,
      //   authorize(["Attendance.settings:update:all"]),
        setAttendanceSettingsForAllUsersController)




  // -----------------------------
  // ⭐ Attendance Logs Routes
  // -----------------------------

  .get("/logs/me",
        authenticate,
        getMyAttendanceThisMonthController)
  .get("/logs/me/range",authenticate,getAttendanceByRangeController)

  // .get("/logs/:userId",
  //       authenticate,
  //       authorize(["Attendance.logs:user:view"]),
  //       getUserAttendanceController)

  // .get("/logs",
  //       authenticate,
  //       authorize(["Attendance.logs:view:all"]),
  //       getAllAttendanceController)

  // .get("/logs/:userId/range",
  //       authenticate,
  //       authorize(["Attendance.logs:user:view", "Attendance.logs:all:view"]),
  //       getAttendanceByRangeController)

export default router;

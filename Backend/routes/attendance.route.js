import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import {
  checkInByFaceController,
  getAttendanceSettingsController,
  registerFaceEmbeddingController,
  setAttendanceSettingsForAllUsersController,
  getMyAttendanceThisMonthController,
  getAttendanceByRangeController
} from "../controllers/attendance.controller.js";

const router = express.Router();

router
  .post("/checkIn",
        authenticate,
        authorize(["Attendance:create"]),
        checkInByFaceController)

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

  .post('/register/face',
        authenticate,
        authorize(["Attendance.settings:face:update"]),
        registerFaceEmbeddingController)

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

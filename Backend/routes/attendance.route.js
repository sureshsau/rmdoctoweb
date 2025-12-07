import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import { checkInByFaceController, getAttendanceSettingsController } from "../controllers/attendance.controller.js";

const router = express.Router();

router
  .post("/checkIn",authenticate,authorize(["Attendance:create"]),checkInByFaceController)
  .get('/settings',authenticate,authorize(["Attendance.settings:view:self","Attendance.settings:view:all"]),getAttendanceSettingsController)

export default router;

import express from "express";
import { createAppointmentController, getAttendanceLogsController } from "../controllers/appointment.controller.js";
import {authenticate} from '../middlewares/auth.middlewire.js'

const router = express.Router();

router.post("/",authenticate, createAppointmentController)
router.get('/attendance', authenticate, getAttendanceLogsController)



export default router;

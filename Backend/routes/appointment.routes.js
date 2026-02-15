import express from "express";
import { createAppointmentController, getAgentAppointmentsController, getAllBookingsController, getMyAppointmentsController } from "../controllers/appointment.controller.js";
import {authenticate} from '../middlewares/auth.middlewire.js'

const router = express.Router();

router.post("/",authenticate, createAppointmentController)
.get("/bookings",authenticate,getAllBookingsController)
.get("/agent/bookings",authenticate,getAgentAppointmentsController)
.get("/bookings/me",authenticate,getMyAppointmentsController)

export default router;

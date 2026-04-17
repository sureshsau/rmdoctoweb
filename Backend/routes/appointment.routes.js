import express from "express";
import { 
  createAppointmentController, 
  getAgentAppointmentsController, 
  getAllBookingsController, 
  getDoctorAppointmentsController, 
  getMyAppointmentsController 
} from "../controllers/appointment.controller.js";
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';

const router = express.Router();

// ── SELF-SERVICE ──────────────────────────────────────────────────────────────
// Any logged-in user can book an appointment
router.post('/', authenticate, createAppointmentController);

// Any logged-in user views their own appointments
router.get('/bookings/me', authenticate, getMyAppointmentsController);

// ── ROLE-INTERNAL (controller checks roles.includes('agent'/'doctor')) ────────
// Agent views their bookings — controller enforces 'agent' role
router.get('/agent/bookings', authenticate, getAgentAppointmentsController);

// Doctor views their appointments — controller enforces 'doctor' role
router.get('/doctor/bookings', authenticate, getDoctorAppointmentsController);

// ── ADMIN / PERMISSION-GATED ──────────────────────────────────────────────────
// Admin / Receptionist / Subadmin view all bookings
router.get('/bookings', authenticate, authorize('appointment.read.all'), getAllBookingsController);

export default router;

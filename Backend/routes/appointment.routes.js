import express from "express";
import {
  createAppointmentController,
  getAgentAppointmentsController,
  getAllBookingsController,
  getDoctorAppointmentsController,
  getMyAppointmentsController,
  uploadAppointmentPrescriptionController,
  getAppointmentPrescriptionController,
  deleteAppointmentPrescriptionController
} from "../controllers/appointment.controller.js";
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { prescriptionUpload } from "../utils/prescriptionUpload.js";
import { handleUpload } from "../utils/handleUpload.js";

const router = express.Router();

// ── SELF-SERVICE ──────────────────────────────────────────────────────────────
// Any logged-in user can book an appointment.
// Accepts JSON, or multipart/form-data with an optional `prescription` file.
router.post(
  '/',
  authenticate,
  handleUpload(prescriptionUpload.single('prescription')),
  createAppointmentController
);

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

// ── PRESCRIPTION (dynamic routes last) ────────────────────────────────────────
// Upload / replace — booker or staff (service enforces it)
router.post(
  '/:appointmentId/prescription',
  authenticate,
  handleUpload(prescriptionUpload.single('prescription')),
  uploadAppointmentPrescriptionController
);

// View — booker, the doctor of the appointment, or staff
router.get('/:appointmentId/prescription', authenticate, getAppointmentPrescriptionController);

// Delete — booker or staff
router.delete('/:appointmentId/prescription', authenticate, deleteAppointmentPrescriptionController);

export default router;

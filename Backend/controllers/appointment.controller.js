
import { createAppointmentService } from "../services/appointment.service.js";
import { fetchAttendanceLogs } from "../services/appointment.service.js";
import AppError from "../utils/AppError.js";

export const createAppointmentController = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      appointmentDate,
      appointmentTime,
      consultationFee,
      symptoms="",
      notes="",
    } = req.body;

    /* ===== Basic Validation ===== */

    if (!doctorId)
      throw new AppError("Doctor id is required", 400);

    if (!patientName || !patientPhone)
      throw new AppError("Patient name and phone are required", 400);

    if (!appointmentDate || !appointmentTime)
      throw new AppError("Appointment date and time are required", 400);

    if (!consultationFee)
      throw new AppError("Consultation fee is required", 400);

    const appointment = await createAppointmentService({
      bookedById: req.user.id, // user who is booking
      doctorId,
      patientData: {
        patientName,
        patientPhone,
        patientAge,
        patientGender,
      },
      appointmentData: {
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        consultationFee,
        symptoms,
        notes,
      },
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


export const getAttendanceLogsController = async (req, res) => {
  try {
    // Only admin and receptionist allowed
    const roles = req.user.roles || [];
    if (!roles.includes('admin') && !roles.includes('receptionist') && !roles.includes('subadmin')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { doctorId, from, to, status, page, limit } = req.query;

    const result = await fetchAttendanceLogs({
      doctorId,
      from,
      to,
      status,
      page,
      limit
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('getAttendanceLogsController:', err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

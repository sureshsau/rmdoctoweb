import Appointment from "../models/appointment.model.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import AttendanceLog from "../models/attendanceLog.model.js";

/**
 * Fetch attendance logs with optional filters and pagination.
 * Filters: doctorId (userId), from, to, status
 * Pagination: page, limit
 */
export const fetchAttendanceLogs = async ({
  doctorId,
  from,
  to,
  status,
  page = 1,
  limit = 20,
  sort = '-attendanceDate'
}) => {
  const query = {};

  if (doctorId) {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new AppError('Invalid doctorId', 400);
    }
    query.userId = doctorId;
  }

  if (from || to) {
    query.attendanceDate = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) throw new AppError('Invalid `from` date', 400);
      query.attendanceDate.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) throw new AppError('Invalid `to` date', 400);
      // include entire day
      d.setHours(23,59,59,999);
      query.attendanceDate.$lte = d;
    }
  }

  if (status) {
    query.status = status;
  }

  page = Number(page) || 1;
  limit = Number(limit) || 20;
  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    AttendanceLog.countDocuments(query),
    AttendanceLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'userId', select: 'name email phone roles faceImage' })
      .lean()
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
    data: logs
  };
};

export const createAppointmentService = async ({
  bookedById,
  doctorId,
  patientData,
  appointmentData,
}) => {
  /* ===== Validate ObjectIds ===== */
  if (!mongoose.Types.ObjectId.isValid(bookedById)) {
    throw new AppError("Invalid bookedBy user id", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError("Invalid doctor id", 400);
  }

  /* ===== Prevent duplicate slot booking ===== */
  const existingAppointment = await Appointment.findOne({
    doctorId,
    appointmentDate: appointmentData.appointmentDate,
    appointmentTime: appointmentData.appointmentTime,
  });

  if (existingAppointment) {
    throw new AppError("This time slot is already booked", 400);
  }

  /* ===== Create Appointment ===== */
  const appointment = await Appointment.create({
    doctorId,
    bookedBy: bookedById,
    ...patientData,
    ...appointmentData,
  });

  return appointment;
};

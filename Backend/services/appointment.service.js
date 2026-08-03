import Appointment from "../models/appointment.model.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import AttendanceLog from "../models/attendanceLog.model.js";
import { s3 } from "../config/aws.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/* ════════════════════════════════════════════════
   S3 — APPOINTMENT PRESCRIPTION
════════════════════════════════════════════════ */
export const uploadAppointmentPrescriptionToS3 = async ({
  appointmentId,
  fileBuffer,
  mimeType,
  fileName,
}) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!fileBuffer || !bucketName) {
    throw new AppError("Missing file upload parameters", 400);
  }

  const safeFileName = decodeURIComponent(fileName || "prescription").replace(
    /[^a-zA-Z0-9.\-]/g,
    "_"
  );
  const ext = mimeType === "application/pdf" ? "pdf" : (mimeType.split("/")[1] || "jpg");
  const key = `appointment-prescriptions/${appointmentId}/${Date.now()}-${safeFileName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentDisposition: "inline",
    })
  );

  return {
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
    key,
  };
};

const deleteFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key })
    );
  } catch (error) {
    console.warn(`Failed to delete S3 object (${key}):`, error.message);
  }
};

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

/* ════════════════════════════════════════════════
   PRESCRIPTION — ACCESS HELPERS
════════════════════════════════════════════════ */
const isStaff = (requester) =>
  requester.roles?.some((r) => ["admin", "subadmin", "receptionist"].includes(r));

const canManagePrescription = (appointment, requester) =>
  appointment.bookedBy.toString() === requester.id.toString() || isStaff(requester);

const canViewPrescription = (appointment, requester) =>
  canManagePrescription(appointment, requester) ||
  appointment.doctorId.toString() === requester.id.toString();

/* ════════════════════════════════════════════════
   PRESCRIPTION — UPLOAD / REPLACE
════════════════════════════════════════════════ */
export const uploadAppointmentPrescriptionService = async ({
  appointmentId,
  requester,
  file,
}) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);

  if (!canManagePrescription(appointment, requester)) {
    throw new AppError(
      "Forbidden: only the person who booked or staff can upload a prescription",
      403
    );
  }

  // Replacing — drop the previous file from S3
  if (appointment.prescription?.key) {
    await deleteFromS3(appointment.prescription.key);
  }

  const result = await uploadAppointmentPrescriptionToS3({
    appointmentId,
    fileBuffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
  });

  appointment.prescription = {
    url: result.url,
    key: result.key,
    uploadedAt: new Date(),
    uploadedBy: requester.id,
  };

  await appointment.save();

  return {
    url: appointment.prescription.url,
    uploadedAt: appointment.prescription.uploadedAt,
  };
};

/* ════════════════════════════════════════════════
   PRESCRIPTION — VIEW
════════════════════════════════════════════════ */
export const getAppointmentPrescriptionService = async ({
  appointmentId,
  requester,
}) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(appointmentId).select(
    "bookedBy doctorId prescription"
  );
  if (!appointment) throw new AppError("Appointment not found", 404);

  if (!canViewPrescription(appointment, requester)) {
    throw new AppError("Forbidden", 403);
  }

  if (!appointment.prescription?.url) {
    throw new AppError("No prescription uploaded for this appointment", 404);
  }

  return {
    url: appointment.prescription.url,
    uploadedAt: appointment.prescription.uploadedAt,
  };
};

/* ════════════════════════════════════════════════
   PRESCRIPTION — DELETE
════════════════════════════════════════════════ */
export const deleteAppointmentPrescriptionService = async ({
  appointmentId,
  requester,
}) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);

  if (!canManagePrescription(appointment, requester)) {
    throw new AppError("Forbidden", 403);
  }

  if (!appointment.prescription?.key) {
    throw new AppError("No prescription to delete", 404);
  }

  await deleteFromS3(appointment.prescription.key);

  appointment.prescription = {
    url: null,
    key: null,
    uploadedAt: null,
    uploadedBy: null,
  };

  await appointment.save();
  return true;
};

export const createAppointmentService = async ({
  bookedById,
  doctorId,
  patientData,
  appointmentData,
  prescriptionFile = null,
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

  /* ===== Optional prescription attached at booking time =====
     The booking itself is already confirmed at this point, so a failed
     upload must not throw it away — report the failure instead and let
     the caller retry via POST /appointment/:appointmentId/prescription  */
  let prescriptionError = null;

  if (prescriptionFile) {
    try {
      const result = await uploadAppointmentPrescriptionToS3({
        appointmentId: appointment._id,
        fileBuffer: prescriptionFile.buffer,
        mimeType: prescriptionFile.mimetype,
        fileName: prescriptionFile.originalname,
      });

      appointment.prescription = {
        url: result.url,
        key: result.key,
        uploadedAt: new Date(),
        uploadedBy: bookedById,
      };

      await appointment.save();
    } catch (error) {
      console.error("Prescription upload failed during booking:", error);
      prescriptionError = "Appointment booked, but the prescription upload failed. Please upload it again.";
    }
  }

  return { appointment, prescriptionError };
};

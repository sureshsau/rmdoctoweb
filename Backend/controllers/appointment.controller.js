
import Appointment from "../models/appointment.model.js";
import {
  createAppointmentService,
  uploadAppointmentPrescriptionService,
  getAppointmentPrescriptionService,
  deleteAppointmentPrescriptionService,
} from "../services/appointment.service.js";
import { fetchAttendanceLogs } from "../services/appointment.service.js";
import AppError from "../utils/AppError.js";
import User from "../models/user.model.js";
import { cleanupUploadedFile } from "../utils/cleanupUploadedFile.js";

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

    if (consultationFee === undefined || consultationFee === null || consultationFee === "")
      throw new AppError("Consultation fee is required", 400);

    /* ===== Numeric fields arrive as strings on multipart requests ===== */
    const parsedFee = Number(consultationFee);
    if (Number.isNaN(parsedFee))
      throw new AppError("Consultation fee must be a number", 400);

    let parsedAge;
    if (patientAge !== undefined && patientAge !== null && patientAge !== "") {
      parsedAge = Number(patientAge);
      if (Number.isNaN(parsedAge))
        throw new AppError("Patient age must be a number", 400);
    }

    const { appointment, prescriptionError } = await createAppointmentService({
      bookedById: req.user.id, // user who is booking
      doctorId,
      patientData: {
        patientName,
        patientPhone,
        patientAge: parsedAge,
        patientGender,
      },
      appointmentData: {
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        consultationFee: parsedFee,
        symptoms,
        notes,
      },
      // Optional — only present when the client posts multipart/form-data
      prescriptionFile: req.file || null,
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      warning: prescriptionError || undefined,
      data: appointment,
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } finally {
    cleanupUploadedFile(req);
  }
};


/* ═══════════════════════════════════════════════
   PRESCRIPTION — UPLOAD / REPLACE
═══════════════════════════════════════════════ */
export const uploadAppointmentPrescriptionController = async (req, res) => {
  try {
    if (!req.file) {
      throw new AppError("Prescription file is required", 400);
    }

    const result = await uploadAppointmentPrescriptionService({
      appointmentId: req.params.appointmentId,
      requester: req.user,
      file: req.file,
    });

    res.status(200).json({
      success: true,
      message: "Prescription uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("uploadAppointmentPrescriptionController:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  } finally {
    cleanupUploadedFile(req);
  }
};


/* ═══════════════════════════════════════════════
   PRESCRIPTION — VIEW
═══════════════════════════════════════════════ */
export const getAppointmentPrescriptionController = async (req, res) => {
  try {
    const result = await getAppointmentPrescriptionService({
      appointmentId: req.params.appointmentId,
      requester: req.user,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 404).json({
      success: false,
      message: error.message,
    });
  }
};


/* ═══════════════════════════════════════════════
   PRESCRIPTION — DELETE
═══════════════════════════════════════════════ */
export const deleteAppointmentPrescriptionController = async (req, res) => {
  try {
    await deleteAppointmentPrescriptionService({
      appointmentId: req.params.appointmentId,
      requester: req.user,
    });

    res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};



export const getAllBookingsController = async (req, res) => {
  try {
    const roles = req.user.roles || [];

    // Only admin & receptionist
    if (
      !roles.includes("admin") &&
      !roles.includes("receptionist") &&
      !roles.includes("subadmin")
    ) {
      throw new AppError("Forbidden", 403);
    }

    const {
      page = 1,
      limit = 10,
      type,
      doctorId,
      from,
      to
    } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (isNaN(currentPage) || isNaN(perPage)) {
      throw new AppError("Invalid pagination values", 400);
    }

    const skip = (currentPage - 1) * perPage;

    let filter = {};

    /* ===== Date Filtering ===== */

    if (type === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      filter.appointmentDate = { $gte: start, $lte: end };
    }

    if (type === "month") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      filter.appointmentDate = { $gte: start, $lte: end };
    }

    if (type === "custom" && from && to) {
      filter.appointmentDate = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    /* ===== Optional Doctor Filter ===== */

    if (doctorId) {
      filter.doctorId = doctorId;
    }

    const totalRecords = await Appointment.countDocuments(filter);

    const bookings = await Appointment.find(filter)
      .populate("doctorId", "name email")
      .populate("bookedBy", "name roles")
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    res.status(200).json({
      success: true,
      pagination: {
        page: currentPage,
        totalPages: Math.ceil(totalRecords / perPage),
        totalRecords
      },
      data: bookings
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};



export const getAgentAppointmentsController = async (req, res) => {
  try {
    const roles = req.user.roles || [];

    // Only agent allowed
    if (!roles.includes("agent")) {
      throw new AppError("Only agents allowed", 403);
    }

    const { page = 1, limit = 10 } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (isNaN(currentPage) || isNaN(perPage)) {
      throw new AppError("Invalid pagination values", 400);
    }

    const skip = (currentPage - 1) * perPage;

    const agentId = req.user.id;

    // Get agent phone
    const agent = await User.findById(agentId).select("phone");

    if (!agent) {
      throw new AppError("Agent not found", 404);
    }

    const filter = {
      $or: [
        { bookedBy: agentId },
        { patientPhone: agent.phone }
      ]
    };

    const totalRecords = await Appointment.countDocuments(filter);

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name email")
      .populate("bookedBy", "name roles")
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    res.status(200).json({
      success: true,
      pagination: {
        page: currentPage,
        totalPages: Math.ceil(totalRecords / perPage),
        totalRecords
      },
      data: appointments
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyAppointmentsController = async (req, res) => {
  try {
    const roles = req.user.roles || [];

    const { page = 1, limit = 10 } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (isNaN(currentPage) || isNaN(perPage)) {
      throw new AppError("Invalid pagination values", 400);
    }

    const skip = (currentPage - 1) * perPage;

    const userId = req.user.id;

    const filter = {
      bookedBy: userId
    };

    const totalRecords = await Appointment.countDocuments(filter);

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name email")
      .populate("bookedBy", "name roles")
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    res.status(200).json({
      success: true,
      pagination: {
        page: currentPage,
        totalPages: Math.ceil(totalRecords / perPage),
        totalRecords
      },
      data: appointments
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};


export const getDoctorAppointmentsController = async (req, res) => {
  try {
    const roles = req.user.roles || [];

    if (!roles.includes("doctor")) {
      throw new AppError("Only doctors can access this", 403);
    }

    const {
      page = 1,
      limit = 10,
      filterType, // today | week | month
      from,
      to
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.max(1, Number(limit) || 10);
    const skip = (currentPage - 1) * perPage;

    const doctorId = req.user.id;

    const query = { doctorId };

    /* ================= DATE FILTER LOGIC ================= */

    const now = new Date();

    if (filterType === "today") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));

      query.appointmentDate = { $gte: start, $lte: end };
    }

    else if (filterType === "week") {
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - now.getDay());
      firstDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      lastDay.setHours(23, 59, 59, 999);

      query.appointmentDate = { $gte: firstDay, $lte: lastDay };
    }

    else if (filterType === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      query.appointmentDate = { $gte: start, $lte: end };
    }

    else if (from || to) {
      query.appointmentDate = {};
      if (from) query.appointmentDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    /* ================= DATABASE QUERY ================= */

    const totalRecords = await Appointment.countDocuments(query);

    const appointments = await Appointment.find(query)
      .populate("doctorId", "name email")
      .populate("bookedBy", "name roles")
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    res.status(200).json({
      success: true,
      filterApplied: filterType || (from || to ? "custom" : "none"),
      pagination: {
        page: currentPage,
        totalPages: Math.ceil(totalRecords / perPage),
        totalRecords
      },
      data: appointments
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};


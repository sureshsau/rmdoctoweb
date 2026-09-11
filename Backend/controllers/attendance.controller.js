import {
  attendanceMarkServiceByFace,
  getAttendanceService,
  registerFaceEmbeddingService,
  setAttendanceSettingsForAllUsers,
  setupUserAttendanceService,
  fetchUserAttendanceLogsService,
  fetchAllAttendanceSettings,
  fetchSelfAttendanceSettings,
  fetchAllUsersAttendanceLogsService,
  exportAttendanceRowsService
} from "../services/attendance.service.js"
import AppError from "../utils/AppError.js";
import { getFaceEmbedding } from "../utils/getFaceEmbedding.js";
import { rowsToCsv } from "../utils/csv.js";
import fs from 'fs';

// Roles that see everything regardless of the fine-grained permission list --
// mirrors auth.middlewire.js's FULL_ACCESS_ROLES so "view all settings" here
// matches what `authorize('attendance.read.all')` would already let through.
const FULL_ACCESS_ROLES = ["admin", "subadmin", "employee"];

export const getAttendanceSettingsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];
    const permissions = req.user.permissions || [];
    const canViewAll = roles.some((r) => FULL_ACCESS_ROLES.includes(r)) || permissions.includes("attendance.read.all");

    // CASE 1: Admin-level user → return every user's settings
    if (canViewAll) {
      const data = await fetchAllAttendanceSettings();
      return res.status(200).json({
        success: true,
        scope: "all",
        count: data.length,
        data
      });
    }

    // CASE 2: Normal user → return own settings only
    const data = await fetchSelfAttendanceSettings(req.user.id);
    return res.status(200).json({
      success: true,
      scope: "self",
      data
    });

  } catch (err) {
    next(err); // pass to global error handler
  }
};

export const setAttendanceSettingsForAllUsersController = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "setting is missing",
      });
    }
    const data = await setAttendanceSettingsForAllUsers(req.body);
    return res.status(200).json({
      success: true,
      message: "set attendance setting for all users",
      updateCount: data.updatedCount
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error"
    });
  }
};

/**
 * Admin: attendance across every user, with date/role/status/search filters
 * and pagination. Query params: from, to, role, status, search, page, limit
 */
export const getAllAttendanceLogsController = async (req, res, next) => {
  try {
    const { from, to, role, status, search, page, limit } = req.query;

    const result = await fetchAllUsersAttendanceLogsService({
      from, to, role, status, search, page, limit
    });

    return res.status(200).json({
      success: true,
      message: "Attendance logs fetched successfully",
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: CSV export of attendance across every user, same filters as above
 * minus pagination. Query params: from, to, role, status, search
 */
export const exportAttendanceCsvController = async (req, res, next) => {
  try {
    const { from, to, role, status, search } = req.query;

    const rows = await exportAttendanceRowsService({ from, to, role, status, search });

    const headers = [
      "Date", "Employee Name", "Phone", "Role", "Status",
      "Check In", "Check Out", "Total Hours", "Late (min)", "Overtime (hrs)", "Location Verified"
    ];

    const csvRows = rows.map((r) => ({
      "Date": r.attendanceDate ? new Date(r.attendanceDate).toISOString().slice(0, 10) : "",
      "Employee Name": r.userId?.name || "",
      "Phone": r.userId?.phone || "",
      "Role": (r.userId?.roles || []).join("; "),
      "Status": r.status || "",
      "Check In": r.checkIn?.time ? new Date(r.checkIn.time).toISOString() : "",
      "Check Out": r.checkOut?.time ? new Date(r.checkOut.time).toISOString() : "",
      "Total Hours": r.totalHours ?? "",
      "Late (min)": r.lateByMinutes ?? "",
      "Overtime (hrs)": r.overtimeHours ?? "",
      "Location Verified": r.locationVerified ? "Yes" : "No"
    }));

    const csv = rowsToCsv(headers, csvRows);
    const filename = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};


export const setupUserAttendanceController = async (req, res) => {


  try {
    const { userId } = req.params;


    const result = await setupUserAttendanceService({
      userId,
      attendanceSettings: req.body,
      faceImageFile: req.file || null
    });
    console.log("attendace setting successfull");
    return res.status(200).json({
      success: true,
      message: "Attendance settings configured successfully",
      data: result
    });

  } catch (error) {
    console.error("❌ setupUserAttendanceController error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};




export const registerFaceEmbeddingController = async (req, res, next) => {
  let imagePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Face image is required",
      });
    }

    imagePath = req.file.path;

    const { userId, faceProportion } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const embedding = await getFaceEmbedding(imagePath);
    console.log(embedding);

    const result = await registerFaceEmbeddingService({
      userId,
      embedding,
      faceProportion,
      imagePath,
    });

    return res.status(201).json({
      success: true,
      message: "Face registered successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Face registration failed",
    });
  } finally {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlink(imagePath, () => {});
    }
  }
};




export const getMyAttendanceThisMonthController = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("User authentication failed. Please login again.", 401));
    }

    // Month/year NOT passed → service uses current month/year automatically
    const result = await getAttendanceService({ userId });

    return res.status(200).json({
      success: true,
      message: "Attendance fetched successfully for current month",
      data: result
    });

  } catch (err) {
    next(err);
  }
};

export const getAttendanceByRangeController = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const { from, to, monthFrom, monthTo, year } = req.query;

    const data = await getAttendanceService({
      userId,
      from,
      to,
      rangeMonthFrom: monthFrom,
      rangeMonthTo: monthTo,
      year
    });
    return res.status(200).json({
      success: true,
      message: "Attendance fetched for range",
      data
    });

  } catch (err) {
    next(err);
  }
};



export const markAttendanceByFaceController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;
    const faceImage = req.file;

    if (!faceImage) {
      return res.status(400).json({
        success: false,
        message: "Face image required"
      });
    }

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    const result = await attendanceMarkServiceByFace({
      userId,
      faceImageBuffer: faceImage.buffer, // 🔥 IMPORTANT
      userLat: Number(lat),
      userLng: Number(lng)
    });

    return res.status(200).json({
      success: true,
      message: `Attendance ${result.action} successful`,
      data: result
    });

  } catch (error) {
    console.error("❌ markAttendanceByFaceController:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get own attendance logs with optional filters and pagination
 * Query params: from, to, page, limit
 */
export const getMyAttendanceLogsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to, page, limit } = req.query;

    const result = await fetchUserAttendanceLogsService({
      userId,
      from,
      to,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      message: "Attendance logs fetched successfully",
      ...result
    });

  } catch (err) {
    console.log(err);
    next(err);
  }
};


/**
 * Get user's attendance logs (admin only)
 * Query params: from, to, page, limit
 */
export const getAttendanceLogsForUserController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { from, to, page, limit } = req.query;
    // Only admin/subadmin allowed
    const roles = req.user.roles || [];
    if (!roles.includes('admin') && !roles.includes('subadmin')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await fetchUserAttendanceLogsService({
      userId,
      from,
      to,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      message: "User attendance logs fetched successfully",
      ...result
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

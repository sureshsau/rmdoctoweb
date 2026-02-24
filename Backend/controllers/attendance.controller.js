import { attendanceMarkServiceByFace, getAttendanceService, registerFaceEmbeddingService, setAttendanceSettingsForAllUsers, setupUserAttendanceService, fetchUserAttendanceLogsService } from "../services/attendance.service.js"
import AppError from "../utils/AppError.js";
import { getFaceEmbedding } from "../utils/getFaceEmbedding.js";
import fs from 'fs';

export const getAttendanceSettingsController = async (req, res, next) => {
  try {
    const permissions = req.user.permissions;
    const canViewAll = permissions.includes("attendance.settings:view");
    const canViewSelf = permissions.includes("attendance.settings:self:view");

    // CASE 1: Admin-level user → return all settings
    if (canViewAll) {
      const data = await fetchAllAttendanceSettings();
      return res.status(200).json({
        success: true,
        scope: "all",
        count: data.length,
        data
      });
    }

    // CASE 2: Normal user → return own settings
    if (canViewSelf) {
      const data = await fetchSelfAttendanceSettings(req.user.id);
      return res.status(200).json({
        success: true,
        scope: "self",
        data
      });
    }

    // CASE 3: No permissions → Forbidden
    throw new AppError("Forbidden: You cannot access attendance settings", 403);

  } catch (err) {
    next(err); // pass to global error handler
  }
};

export const setAttendanceSettingsForAllUsersController=async(req,res)=>{
  try{
    if(!req.body){
      res.status(400).json({
        message:"setting is missing",
      })
    }
    const data=await setAttendanceSettingsForAllUsers(req.body);
    return res.status(200).json({
      message:"set attendance setting for all users",
      updateCounte:data.updatedCount
    })
  }catch(err){
      throw new AppError("Internal Server Error",500);
  }
}


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

import { checkIn, checkInByFaceService, getAttendanceService, registerFaceEmbeddingService, setAttendanceSettingsForAllUsers } from "../services/attendance.service.js"
import AppError from "../utils/AppError.js";

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


export const registerFaceEmbeddingController = async (req, res, next) => {
  try {
    const { userId, embedding, faceProportion } = req.body;

    const result = await registerFaceEmbeddingService({
      userId,
      embedding,
      faceProportion
    });

    res.status(200).json({
      success: true,
      message: "Face registered successfully",
      data: result
    });

  } catch (err) {
    next(err);
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


export const checkInByFaceController = async (req, res, next) => {
  try {
    const { faceEmbedding, lat, lng, deviceInfo, imageUrl } = req.body;

    const result = await checkInByFaceService({
      userId: req.user.id,
      faceEmbedding,
      lat,
      lng,
      deviceInfo,
      imageUrl
    });

    res.status(200).json(result);

  } catch (err) {
    next(err);
  }
};


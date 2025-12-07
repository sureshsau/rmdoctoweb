import { checkIn, setAttendanceSettingsForAllUsers } from "../services/attendance.service.js"
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
    await setAttendanceSettingsForAllUsers(req.body);
  }catch(err){
      throw new AppError("Internal Server Error",500);
  }
}

export const checkInByFaceController=async(req,res)=>{
    try{
        const {location}=req.body;
    }catch(err){
        
    }
}
import AppError from "../utils/AppError.js"
import AttendanceSettings from '../models/attendanceSettings.model.js'

export async function fetchSelfAttendanceSettings(userId) {
  const settings = await AttendanceSettings.findOne({ userId }).lean();

  if (!settings) {
    throw new AppError("Attendance settings not found", 404);
  }

  return settings;
}

export async function fetchAllAttendanceSettings() {
  const settings = await AttendanceSettings.find().lean();
  return settings;
}

export const createAttendanceSetting=async(data)=>{
    try{
        if(!data){
            throw new AppError('missing payload for creating attendance setting');
        }
        console.log(data);
        const attendanceSetting=await AttendanceSettings.findOne({
            userId:data.userId
        });
        if(attendanceSetting){
            return;
        } 
        await AttendanceSettings.create({
            userId:data.userId
        })
    }catch(err){
        throw new AppError("Internal server error while creating Attendance schema",500);
    }
}



export const checkIn=async(data)=>{
    try{
        if(!data){
            throw new AppError('payload is missing',400);
        }
        console.log(data);

    }catch(err){

    }
}

/**
 * Update attendance settings for ALL users (but only the fields that exist in settings)
 */
export const setAttendanceSettingsForAllUsers = async (settings) => {
  try {
    if (!settings || typeof settings !== "object") {
      throw new AppError("Invalid settings payload", 400);
    }

    // ---------------------------------------
    // Build dynamic update object ($set only)
    // ---------------------------------------
    const updateData = {};

    const allowedFields = [
      "shiftStartTime",
      "shiftEndTime",
      "requiredHoursPerDay",
      "halfDayMinHours",
      "graceMinutes",
      "weeklyOffDays",
      "allowedLocations",
      "faceEmbedding",
      "faceProportion",
      "overtimeAllowed",
      "otAfterHours"
    ];

    for (const key of allowedFields) {
      if (settings[key] !== undefined) {
        updateData[key] = settings[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No valid settings fields provided", 400);
    }

    // ---------------------------------------
    // Apply update to ALL attendance settings
    // ---------------------------------------
    const result = await AttendanceSettings.updateMany(
      {},
      { $set: updateData }
    );

    return {
      updatedCount: result.modifiedCount,
      appliedSettings: updateData
    };

  } catch (err) {
    console.error("setAttendanceSettingsForAllUsers ERROR:", err);
    throw new AppError("Internal Server Error while updating settings", 500);
  }
};

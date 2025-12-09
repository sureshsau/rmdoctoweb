import AppError from "../utils/AppError.js"
import AttendanceSettings from '../models/attendanceSettings.model.js'
import mongoose from "mongoose";

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
      throw new AppError("Invalid attendance settings payload", 400);
    }

    const allowedFields = [
      "shiftStartTime",
      "shiftEndTime",
      "requiredHoursPerDay",
      "halfDayMinHours",
      "graceMinutes",
      "weeklyOffDays",
      "allowedLocation",
      "overtimeAllowed"
    ];

    const updateData = {};

    for (const key of allowedFields) {
      if (settings[key] !== undefined) {
        updateData[key] = settings[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No valid attendance settings fields provided", 400);
    }

    // Validate location only if present
    if (updateData.allowedLocation) {
      const loc = updateData.allowedLocation;

      if (
        !loc.name ||
        typeof loc.lat !== "number" ||
        typeof loc.lng !== "number"
      ) {
        throw new AppError("Invalid allowedLocation object", 400);
      }

      if (!loc.radiusMeters) loc.radiusMeters = 10;
    }

    // Update ALL users
    const result = await AttendanceSettings.updateMany({}, { $set: updateData });

    const updatedCount =
      result.modifiedCount ??
      result.nModified ??
      0;

    return {
      updatedCount,
      appliedSettings: updateData
    };

  } catch (err) {
    console.error("setAttendanceSettingsForAllUsers ERROR:", err);
    throw new AppError("Internal Server Error while updating attendance settings", 500);
  }
};





export async function registerFaceEmbeddingService({ userId, embedding, faceProportion }) {
  // --------------------------
  // 1. Validate userId
  // --------------------------
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid userId", 400);
  }

  // --------------------------
  // 2. Validate 128D embedding
  // --------------------------
  if (!Array.isArray(embedding) || embedding.length !== 128) {
    throw new AppError("Face embedding must be a 128-length array", 400);
  }

  // --------------------------
  // 3. Find existing settings or create new one
  // --------------------------
  let settings = await AttendanceSettings.findById(userId );

  if (!settings) {
    // Create new settings with face embedding
    settings = new AttendanceSettings({
      userId,
      faceEmbedding: embedding,
      faceProportion: faceProportion || {}
    });

    await settings.save();
    return settings;
  }

  // --------------------------
  // 4. Update ONLY what is provided
  // --------------------------
  settings.faceEmbedding = embedding;

  if (faceProportion && typeof faceProportion === "object") {
    // merge fields (safe update)
    settings.faceProportion = {
      ...settings.faceProportion,
      ...faceProportion
    };
  }

  await settings.save();

  return settings;
}

// ================================
// ⭐ UNIVERSAL ATTENDANCE SERVICE
// ================================
export async function getAttendanceService({
  userId,
  from,
  to,
  month,
  year,
  lastMonth = false,
  rangeMonthFrom,
  rangeMonthTo
}) {
  // -------------------------
  // 1. Validate userId
  // -------------------------
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid userId", 400);
  }

  const now = new Date();

  // --------------------------------------------------
  // 2. CASE A → last month
  // --------------------------------------------------
  if (lastMonth === true) {
    let m = now.getMonth();        // JS: Jan=0 → LastMonth = 0 = Jan
    let y = now.getFullYear();

    if (m === 0) {                 // If current month = Jan
      m = 12;
      y = y - 1;
    }

    from = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }

  // --------------------------------------------------
  // 3. CASE B → current month
  // --------------------------------------------------
  if (!from && !to && month && year) {
    const m = Number(month);
    const y = Number(year);

    from = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    to = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  }

  // --------------------------------------------------
  // 4. CASE C → THIS MONTH (DEFAULT)
  // --------------------------------------------------
  if (!from && !to && !rangeMonthFrom && !rangeMonthTo && !lastMonth) {
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    from = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    to = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  }

  // --------------------------------------------------
  // 5. CASE D → Month-to-Month Range
  // --------------------------------------------------
  if (rangeMonthFrom && rangeMonthTo && year) {
    const m1 = Number(rangeMonthFrom);
    const m2 = Number(rangeMonthTo);
    const y = Number(year);

    from = `${y}-${String(m1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m2, 0).getDate();
    to = `${y}-${String(m2).padStart(2, "0")}-${lastDay}`;
  }

  // --------------------------------------------------
  // 6. Ensure final date range exists
  // --------------------------------------------------
  if (!from || !to) {
    throw new AppError("Invalid date range. Provide (from,to) OR (month,year) OR rangeMonthFrom & rangeMonthTo OR lastMonth.", 400);
  }

  // --------------------------------------------------
  // 7. Fetch Attendance
  // --------------------------------------------------
  const logs = await Attendance.find({
    userId,
    date: { $gte: from, $lte: to }
  })
    .sort({ date: 1 })
    .lean();

  return {
    range: { from, to },
    count: logs.length,
    logs
  };
}

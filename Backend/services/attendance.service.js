import AppError from "../utils/AppError.js"
import AttendanceSettings from '../models/attendanceSettings.model.js'
import mongoose from "mongoose";
import redisClient from '../config/redis.config.js'

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
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== 128 || vecB.length !== 128) return 0;

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < 128; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
function isWithinRadius(lat1, lng1, lat2, lng2, radiusMeters = 20) {
  const R = 6371e3; // Earth radius in m
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return distance <= radiusMeters;
}

export const checkInByFaceService = async ({
  userId,
  faceEmbedding,
  lat,
  lng,
  deviceInfo,
  imageUrl
}) => {
  if (!Array.isArray(faceEmbedding) || faceEmbedding.length !== 128) {
    throw new AppError("Invalid face embedding vector", 400);
  }

  // ----------------------------------------------------------------
  // 1️⃣ FETCH SETTINGS (Try Redis → fallback MongoDB)
  // ----------------------------------------------------------------
  let settings;

  const redisKey = `attendance_settings:${userId}`;

  const cached = await redisClient.get(redisKey);

  if (cached) {
    settings = JSON.parse(cached);
  } else {
    settings = await AttendanceSettings.findOne({ userId }).lean();
    if (!settings) throw new AppError("Attendance settings missing for user", 404);

    // Cache for 5 hours
    redisClient.set(redisKey, JSON.stringify(settings), "EX", 60 * 60 * 5);
  }

  // ----------------------------------------------------------------
  // 2️⃣ FACE MATCHING
  // ----------------------------------------------------------------
  const storedEmbedding = settings.faceEmbedding;

  if (!storedEmbedding)
    throw new AppError("Face reference not registered for user", 400);

  const similarity = cosineSimilarity(faceEmbedding, storedEmbedding);
  const confidence = Number(similarity.toFixed(3)); // accuracy 0.000

  const faceMatched = confidence >= 0.85; // threshold (adjust)

  // ----------------------------------------------------------------
  // 3️⃣ LOCATION CHECK
  // ----------------------------------------------------------------
  let locationValid = false;

  if (settings.allowedLocation) {
    locationValid = isWithinRadius(
      lat,
      lng,
      settings.allowedLocation.lat,
      settings.allowedLocation.lng,
      settings.allowedLocation.radiusMeters || 20
    );
  }

  // ----------------------------------------------------------------
  // 4️⃣ PREVENT DOUBLE CHECK-IN
  // ----------------------------------------------------------------
  const today = new Date().toISOString().split("T")[0];

  let attendance = await Attendance.findOne({ userId, date: today });

  if (attendance && attendance.checkIn && attendance.checkIn.time) {
    throw new AppError("User already checked in today", 400);
  }

  // ----------------------------------------------------------------
  // 5️⃣ CREATE / UPDATE ATTENDANCE ENTRY
  // ----------------------------------------------------------------
  if (!attendance) {
    attendance = new Attendance({
      userId,
      date: today
    });
  }

  attendance.checkIn = {
    time: new Date(),
    lat,
    lng,
    verifiedBy: faceMatched ? "face" : "manual_review",
    confidence,
    imageUrl,
    spoofDetected: !faceMatched,
    deviceInfo
  };

  // Fraud Detection Flags
  attendance.fraudCheck = {
    gpsMismatch: !locationValid,
    repeatedFace: false,
    suspiciousActivity: faceMatched ? null : "Low confidence face match"
  };

  await attendance.save();

  return {
    message: "Check-in successful",
    checkIn: attendance.checkIn,
    fraud: attendance.fraudCheck,
    faceMatched,
    locationValid,
    confidence
  };
};

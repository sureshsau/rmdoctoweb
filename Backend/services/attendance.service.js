import AppError from "../utils/AppError.js"
import AttendanceSettings from '../models/attendanceSettings.model.js'
import mongoose from "mongoose";
import redisClient from '../config/redis.config.js'
import { registerFaceToAwsAndStoreImageToS3, verifyFaceWithRekognition } from "./aws.service.js";
import AttendanceLog from "../models/attendanceLog.model.js";





export const setupUserAttendanceService = async ({
  userId,
  attendanceSettings,
  faceImageFile
}) => {
  if (!userId) {
    const err = new Error("userId is required");
    err.statusCode = 400;
    throw err;
  }

  console.log("👉 setupUserAttendanceService called");
  console.log("🔹 faceImageFile present:", !!faceImageFile);

  // 🔐 CREATE-ONLY
  const settings = new AttendanceSettings({
    userId,
    ...attendanceSettings
  });

  // 👤 Optional face registration
  if (faceImageFile) {
    if (!faceImageFile.buffer) {
      throw new Error("Face image buffer missing (multer misconfigured)");
    }

    console.log("⏫ registering face with AWS...");

    const faceData = await registerFaceToAwsAndStoreImageToS3({
      userId,
      imageBuffer: faceImageFile.buffer,
      mimeType: faceImageFile.mimetype
    });

    console.log("✅ face registered:", faceData);

    settings.faceId = faceData.faceId;
    settings.faceImage = {
      bucket: faceData.bucketName,
      key: faceData.key
    };
    settings.faceRegisteredAt = new Date();
    settings.isFaceActive = true;
  }

  try {
    await settings.save();
    console.log("✅ AttendanceSettings saved:", settings._id);
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error("Attendance settings already exist for this user");
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  return {
    settingsId: settings._id,
    faceRegistered: Boolean(faceImageFile)
  };
};





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

export const attendanceMarkServiceByFace = async ({
  userId,
  faceImageBuffer,
  userLat,
  userLng
}) => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1️⃣ Load attendance settings
  const settings = await AttendanceSettings.findOne({
    userId,
    isFaceActive: true
  });

  if (!settings) {
    throw new Error("Attendance settings not configured");
  }

  // 2️⃣ GEO-FENCE VALIDATION
  if (settings.allowedLocation) {
    if (userLat == null || userLng == null) {
      throw new Error("Location permission required");
    }

    const { lat, lng, radiusMeters } = settings.allowedLocation;

    const distance = calculateDistanceMeters(
      lat,
      lng,
      userLat,
      userLng
    );

    if (distance > radiusMeters) {
      throw new Error("You are outside allowed attendance location");
    }
  }

  // 3️⃣ Load today's attendance
  let attendance = await AttendanceLog.findOne({
    userId,
    attendanceDate: today
  });

  // 4️⃣ FACE VERIFICATION (🔥 BUFFER BASED)
  const faceVerification = await verifyFaceWithRekognition({
    imageBuffer: faceImageBuffer,
    expectedFaceId: settings.faceId
  });

  if (!faceVerification.verified) {
    throw new Error("Face verification failed");
  }

  // 5️⃣ CHECK-IN
  if (!attendance) {
    attendance = new AttendanceLog({
      userId,
      attendanceDate: today,
      locationVerified: true,
      locationDistanceMeters: Math.round(
        calculateDistanceMeters(
          settings.allowedLocation.lat,
          settings.allowedLocation.lng,
          userLat,
          userLng
        )
      ),
      checkIn: {
        time: now,
        verifiedBy: "FACE",
        confidence: faceVerification.confidence,
        faceIdUsed: faceVerification.faceId
      },
      status: "WORKING"
    });

    await attendance.save();

    return {
      action: "CHECK_IN",
      time: now
    };
  }

  // 6️⃣ CHECK-OUT
  // 6️⃣ CHECK-OUT (WITH CALCULATION)
if (attendance.checkIn?.time && !attendance.checkOut?.time) {
  attendance.checkOut = {
    time: now,
    verifiedBy: "FACE",
    confidence: faceVerification.confidence,
    faceIdUsed: faceVerification.faceId
  };

  // ⏱️ WORK DURATION
  const workedMinutes = diffMinutes(
    attendance.checkIn.time,
    now
  );

  attendance.totalHours = Number(
    (workedMinutes / 60).toFixed(2)
  );

  // 🕘 SHIFT TIMES
  const shiftStartMin = parseTimeToMinutes(
    settings.shiftStartTime
  );
  const shiftEndMin = parseTimeToMinutes(
    settings.shiftEndTime
  );
  const requiredMin = settings.requiredHoursPerDay * 60;
  const halfDayMin = settings.halfDayMinHours * 60;

  const checkInMin =
    attendance.checkIn.time.getHours() * 60 +
    attendance.checkIn.time.getMinutes();

  const checkOutMin =
    now.getHours() * 60 +
    now.getMinutes();

  // ⏰ LATE ENTRY
  if (checkInMin > shiftStartMin + settings.graceMinutes) {
    attendance.lateByMinutes =
      checkInMin - (shiftStartMin + settings.graceMinutes);
  }

  // 🚪 EARLY LEAVE
  if (checkOutMin < shiftEndMin) {
    attendance.earlyLeaveMinutes =
      shiftEndMin - checkOutMin;
  }

  // 📊 FINAL STATUS
  if (workedMinutes >= requiredMin) {
    attendance.status = "PRESENT_FULL";
  } else if (workedMinutes >= halfDayMin) {
    attendance.status = "PRESENT_HALF";
  } else {
    attendance.status = "ABSENT";
  }

  await attendance.save();

  return {
    action: "CHECK_OUT",
    time: now,
    workedHours: attendance.totalHours,
    status: attendance.status
  };
}


  throw new Error("Attendance already completed for today");
};


export const calculateDistanceMeters = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null
  ) {
    throw new Error("Invalid coordinates for distance calculation");
  }

  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
};

const parseTimeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const diffMinutes = (start, end) => {
  return Math.max(0, Math.floor((end - start) / 60000));
};

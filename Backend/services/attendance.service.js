import AppError from "../utils/AppError.js"
import AttendanceSettings from '../models/attendanceSettings.model.js'
import USER from '../models/user.model.js'
import mongoose from "mongoose";
// NOTE: `redisClient` is imported but not used in this file. Kept for future caching needs.
import redisClient from '../config/redis.config.js'
import { registerFaceToAwsAndStoreImageToS3, verifyFaceWithRekognition, uploadAttendanceImageToS3 } from "./aws.service.js";
import AttendanceLog from "../models/attendanceLog.model.js";
import { rekognition } from "../config/aws.config.js";
import { DeleteFacesCommand } from "@aws-sdk/client-rekognition";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";


/*
 * Attendance service
 * ------------------
 * This module contains functions to manage attendance related data and actions.
 * Major responsibilities:
 * - Create and update per-user attendance settings (`AttendanceSettings` model)
 * - Register face embeddings and images with AWS Rekognition/S3
 * - Mark attendance using face verification (check-in / check-out)
 * - Retrieve attendance logs for a user over a date range
 *
 * TODOs / Known issues (documented here so callers can decide changes):
 * - `getAttendanceService` uses `Attendance.find(...)` in the original code; ensure
 *   the correct model is used for historical logs. This file references `AttendanceLog`.
 * - `registerFaceEmbeddingService` previously used `findById(userId)` on settings which
 *   is ambiguous: if `userId` is not the _id of AttendanceSettings, prefer
 *   `findOne({ userId })` — callers should confirm schema relation.
 * - Several places throw generic `Error`. For HTTP controllers prefer `AppError`.
 * - `checkIn` is a stub and needs implementation (left intentionally unmodified here).
 */






export const setupUserAttendanceService = async ({
  userId,
  attendanceSettings,
  faceImageFile
}) => {
  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  console.log("👉 setupUserAttendanceService called");

  // 🔎 1️⃣ Check if settings already exist
  let settings = await AttendanceSettings.findOne({ userId });

  const isUpdate = Boolean(settings);

  if (!settings) {
    settings = new AttendanceSettings({
      userId,
      ...attendanceSettings
    });
  } else {
    // update settings fields
    Object.assign(settings, attendanceSettings);
  }

  // =====================================================
  // 👤 FACE REGISTRATION / UPDATE FLOW
  // =====================================================
  if (faceImageFile) {

    if (!faceImageFile.buffer) {
      throw new AppError("Face image buffer missing", 400);
    }

    // 🧹 2️⃣ If updating → delete old face + image
    if (isUpdate && settings.faceId) {

      console.log("🧹 Deleting old face embedding...");

      try {
        await rekognition.send(
          new DeleteFacesCommand({
            CollectionId: process.env.REKOGNITION_COLLECTION,
            FaceIds: [settings.faceId]
          })
        );
      } catch (err) {
        console.error("Failed to delete old face embedding", err.message);
      }

      if (settings.faceImage?.bucket && settings.faceImage?.key) {
        console.log("🧹 Deleting old S3 face image...");
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: settings.faceImage.bucket,
              Key: settings.faceImage.key
            })
          );
        } catch (err) {
          console.error("Failed to delete old S3 image", err.message);
        }
      }
    }

    // 3️⃣ Register new face
    console.log("⏫ Registering new face...");

    const faceData = await registerFaceToAwsAndStoreImageToS3({
      userId,
      imageBuffer: faceImageFile.buffer,
      mimeType: faceImageFile.mimetype
    });

    settings.faceId = faceData.faceId;
    settings.faceImage = {
      bucket: faceData.bucketName,
      key: faceData.key
    };

    settings.faceRegisteredAt = new Date();
    settings.isFaceActive = true;

    // 4️⃣ Update user profile face image
    await USER.findByIdAndUpdate(userId, {
      $set: {
        faceImage: {
          url: faceData.imageUrl,
          bucket: faceData.bucketName,
          key: faceData.key,
          updatedAt: new Date()
        }
      }
    });
  }

  // =====================================================
  // 💾 SAVE SETTINGS
  // =====================================================
  await settings.save();

  console.log("✅ AttendanceSettings saved:", settings._id);

  return {
    settingsId: settings._id,
    updated: isUpdate,
    faceRegistered: Boolean(faceImageFile)
  };
};






export async function fetchSelfAttendanceSettings(userId) {
  /**
   * Fetch the attendance settings for a single user.
   * Returns a plain object (using `.lean()`) or throws `AppError(404)` when not found.
   */
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
  try {
    if (!data) {
      throw new AppError('missing payload for creating attendance setting');
    }

    console.log(data);

    const attendanceSetting = await AttendanceSettings.findOne({
      userId: data.userId
    });

    if (attendanceSetting) {
      return attendanceSetting;
    }

    const created = await AttendanceSettings.create({
      userId: data.userId
    });

    return created;
  } catch (err) {
    throw new AppError("Internal server error while creating Attendance schema", 500);
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

    // Only apply to users with employee roles
    const employeeRoles = ["marketing_agent", "doctor", "subadmin", "receptionist"];

    const users = await USER.find({ roles: { $in: employeeRoles }, isActive: true }).select("_id").lean();

    if (!users || users.length === 0) {
      return { updatedCount: 0, appliedSettings: updateData };
    }

    const ops = users.map(u => ({
      updateOne: {
        filter: { userId: u._id },
        update: { $set: updateData, $setOnInsert: { userId: u._id } },
        upsert: true
      }
    }));

    const result = await AttendanceSettings.bulkWrite(ops, { ordered: false });

    const modified = result.modifiedCount ?? result.nModified ?? 0;
    const upserted = result.upsertedCount ?? (result.upserted ? Object.keys(result.upserted).length : 0) ?? 0;

    const updatedCount = modified + upserted;

    return { updatedCount, appliedSettings: updateData };

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
  // IMPORTANT: In many schemas AttendanceSettings._id != userId. Prefer to find
  // by the `userId` field unless the settings document _id is intentionally the
  // same as the user id. This keeps behavior explicit and consistent.
  let settings = await AttendanceSettings.findOne({ userId });

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
  // NOTE: Convert `from`/`to` strings to Date objects before querying.
  // Using strings may lead to incorrect comparisons if the DB stores Date types.
  const fromDate = new Date(from);
  const toDate = new Date(to);
  // Ensure `toDate` covers the whole day by setting to end of day.
  toDate.setHours(23,59,59,999);

  // Query the AttendanceLog model (historical logs).
  const logs = await AttendanceLog.find({
    userId,
    attendanceDate: { $gte: fromDate, $lte: toDate }
  })
    .sort({ attendanceDate: 1 })
    .lean();

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
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

  // 4.5️⃣ Upload attendance snapshot to S3 and update user's faceImage
  try {
    const uploaded = await uploadAttendanceImageToS3({
      userId,
      imageBuffer: faceImageBuffer,
      mimeType: 'image/jpeg'
    });

    await USER.findByIdAndUpdate(userId, {
      $set: {
        faceImage: {
          url: uploaded.url,
          bucket: uploaded.bucketName,
          key: uploaded.key,
          updatedAt: new Date()
        }
      }
    });
  } catch (err) {
    console.error('Failed to upload attendance snapshot or update user.faceImage', err);
    // Do not block attendance flow for upload failures
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
  // Safely parse `HH:MM`. If `timeStr` is falsy or malformed, return 0.
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(":");
  if (parts.length < 2) return 0;
  const [h, m] = parts.map(p => Number(p) || 0);
  return h * 60 + m;
};

const diffMinutes = (start, end) => {
  return Math.max(0, Math.floor((end - start) / 60000));
};

/**
 * Fetch attendance logs for a user with optional filters and pagination
 * Filters: from, to
 * Pagination: page (default 1), limit (default 10)
 * Returns latest records first
 */
export const fetchUserAttendanceLogsService = async ({
  userId,
  from,
  to,
  page = 1,
  limit = 10
}) => {

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid userId", 400);
  }

  /* ================= DATE RANGE ================= */

  let startDate, endDate;

  if (from || to) {
    startDate = from ? new Date(from) : new Date(0);
    endDate = to ? new Date(to) : new Date();

    if (isNaN(startDate)) throw new AppError("Invalid `from` date", 400);
    if (isNaN(endDate)) throw new AppError("Invalid `to` date", 400);

    endDate.setHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const query = {
    userId,
    attendanceDate: { $gte: startDate, $lte: endDate }
  };

  /* ================= PAGINATION ================= */

  page = Math.max(1, Number(page) || 1);
  limit = Math.max(1, Math.min(Number(limit) || 10, 100));
  const skip = (page - 1) * limit;

  const [total, logs, allLogsForSummary] = await Promise.all([
    AttendanceLog.countDocuments(query),

    AttendanceLog.find(query)
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AttendanceLog.find(query).lean() // for overview summary
  ]);

  /* ================= OVERVIEW CALCULATION ================= */

  let presentFull = 0;
  let presentHalf = 0;
  let absent = 0;
  let leaveApproved = 0;
  let holidays = 0;
  let totalHours = 0;
  let lateMinutes = 0;
  let overtimeHours = 0;

  allLogsForSummary.forEach(log => {

    switch (log.status) {
      case "PRESENT_FULL":
        presentFull++;
        break;
      case "PRESENT_HALF":
        presentHalf++;
        break;
      case "ABSENT":
        absent++;
        break;
      case "LEAVE_APPROVED":
        leaveApproved++;
        break;
    }

    if (log.holiday?.isHoliday) holidays++;

    totalHours += log.totalHours || 0;
    lateMinutes += log.lateByMinutes || 0;
    overtimeHours += log.overtimeHours || 0;
  });

  const overview = {
    totalDays: allLogsForSummary.length,
    presentFull,
    presentHalf,
    absent,
    leaveApproved,
    holidays,
    totalHours: Number(totalHours.toFixed(2)),
    lateMinutes,
    overtimeHours: Number(overtimeHours.toFixed(2))
  };

  return {
    overview,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
      count: logs.length
    },
    logs
  };
};


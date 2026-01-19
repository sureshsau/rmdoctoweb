import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const AttendanceLogSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    companyId: {
      type: ObjectId,
      ref: "Company",
      index: true
    },

    // One log per user per day (normalized date)
    attendanceDate: {
      type: Date,
      required: true,
      index: true
    },

    // -------- CHECK-IN --------
    checkIn: {
      time: { type: Date, default: null },

      verifiedBy: {
        type: String,
        enum: ["FACE", "MANUAL", "ADMIN", "SYSTEM"]
      },

      confidence: {
        type: Number,
        min: 0,
        max: 100
      },

      faceIdUsed: String,

      image: {
        bucket: String,
        key: String
      },

      spoofDetected: {
        type: Boolean,
        default: false
      },

      deviceInfo: {
        model: String,
        os: String,
        appVersion: String
      }
    },

    // -------- CHECK-OUT --------
    checkOut: {
      time: { type: Date, default: null }, // 🔥 IMPORTANT FIX

      verifiedBy: {
        type: String,
        enum: ["FACE", "MANUAL", "ADMIN", "SYSTEM"]
      },

      confidence: {
        type: Number,
        min: 0,
        max: 100
      },

      faceIdUsed: String,

      image: {
        bucket: String,
        key: String
      },

      deviceInfo: {
        model: String,
        os: String,
        appVersion: String
      }
    },

    // -------- LOCATION VALIDATION --------
    locationVerified: {
      type: Boolean,
      default: true
    },

    locationDistanceMeters: Number,

    // -------- CALCULATED METRICS --------
    totalHours: Number,
    lateByMinutes: Number,
    earlyLeaveMinutes: Number,
    overtimeHours: Number,

    // -------- FINAL STATUS --------
    status: {
      type: String,
      enum: [
        "WORKING",
        "PRESENT_FULL",
        "PRESENT_HALF",
        "ABSENT",
        "WEEKLY_OFF",
        "HOLIDAY",
        "LEAVE_APPROVED",
        "MANUAL_PRESENT"
      ],
      default: "WORKING",
      index: true
    },

    // -------- LEAVE / HOLIDAY --------
    leaveApplied: {
      type: Boolean,
      default: false
    },

    holiday: {
      isHoliday: { type: Boolean, default: false },
      name: String
    },

    // -------- MANUAL OVERRIDE --------
    manualOverride: {
      requested: { type: Boolean, default: false },
      approved: { type: Boolean, default: false },
      reason: String,
      approvedBy: { type: ObjectId, ref: "User" }
    },

    // -------- FRAUD FLAGS --------
    fraudCheck: {
      gpsMismatch: { type: Boolean, default: false },
      repeatedFace: { type: Boolean, default: false },
      suspiciousActivity: String
    }
  },
  { timestamps: true }
);

// 🔐 Enforce one attendance per user per day
AttendanceLogSchema.index(
  { userId: 1, attendanceDate: 1 },
  { unique: true }
);

const AttendanceLog = mongoose.model("AttendanceLog", AttendanceLogSchema);
export default AttendanceLog;

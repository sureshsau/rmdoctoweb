import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const AttendanceSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    // Shift configs
    shiftStartTime: { type: String, default: "09:00" },
    shiftEndTime: { type: String, default: "17:00" },
    requiredHoursPerDay: { type: Number, default: 8 },
    halfDayMinHours: { type: Number, default: 4 },
    graceMinutes: { type: Number, default: 10 },

    // Weekly off
    weeklyOffDays: {
      type: [String], // ["Sunday", "Saturday"]
      default: [],
    },

    // ================
    // SINGLE LOCATION
    // ================
    allowedLocation: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        radiusMeters: { type: Number, default: 10 },
      },
      default: null,
    },

    // ============================
    // ⭐ FACE RECOGNITION STORAGE
    // ============================

    // 128D embedding vector
    faceEmbedding: {
      type: [Number],
      validate: (v) => !v || v.length === 128,
      default: null,
    },

    // Face proportion / landmark ratios
    faceProportion: {
      eyeDistance: Number,
      noseWidth: Number,
      jawRatio: Number,
      faceWidth: Number,
      faceHeight: Number,
      headPose: {
        roll: Number,
        pitch: Number,
        yaw: Number,
      },
    },

    // Future support
    overtimeAllowed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AttendanceSettings = mongoose.model(
  "AttendanceSettings",
  AttendanceSettingsSchema
);

export default AttendanceSettings;

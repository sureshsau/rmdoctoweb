import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const AttendanceSettingsSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", unique: true, required: true },

  // Shift configuration
  shiftStartTime: { type: String, default: "09:00" },
  shiftEndTime: { type: String, default: "17:00" },
  requiredHoursPerDay: { type: Number, default: 8 },
  halfDayMinHours: { type: Number, default: 4 },
  graceMinutes: { type: Number, default: 10 },

  // Weekly off
  weeklyOffDays: {
    type: [String],
    default: []
  },

  // Allowed locations for attendance
  allowedLocations: [
    {
      name: String,
      lat: Number,
      lng: Number,
      radiusMeters: { type: Number, default: 50 }
    }
  ],

  // ============================
  // ⭐ FACE RECOGNITION STORAGE
  // ============================

  // 128D vector for face recognition
  faceEmbedding: {
    type: [Number],
    validate: v => !v || v.length === 128,
    default: null
  },

  // Face proportion / landmarks for liveness & identity match
  faceProportion: {
    eyeDistance: { type: Number },
    noseWidth: { type: Number },
    jawRatio: { type: Number },
    faceWidth: { type: Number },
    faceHeight: { type: Number },
    headPose: {
      roll: Number,
      pitch: Number,
      yaw: Number
    }
  },

  // Optional future
  overtimeAllowed: { type: Boolean, default: false },
  otAfterHours: { type: Number, default: 8 }

}, { timestamps: true });

const AttendanceSettings = mongoose.model("AttendanceSettings", AttendanceSettingsSchema);
export default AttendanceSettings;

import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const AttendanceSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Shift configuration
    shiftStartTime: { type: String, default: "09:00" },
    shiftEndTime: { type: String, default: "17:00" },
    requiredHoursPerDay: { type: Number, default: 8 },
    halfDayMinHours: { type: Number, default: 4 },
    graceMinutes: { type: Number, default: 10 },

    // Weekly off
    weeklyOffDays: {
      type: [String],
      default: [],
    },

    // Location restriction
    allowedLocation: {
      lat: Number,
      lng: Number,
      radiusMeters: { type: Number, default: 50 },
      strict: { type: Boolean, default: true },
    },

    // AWS Rekognition reference
    faceId: {
      type: String,
      index: true,
    },

    faceImage: {
      bucket: { type: String,required:true},
      key: { type: String,required:true },
    },

    faceRegisteredAt: {
      type: Date,
      default: Date.now,
    },

    isFaceActive: {
      type: Boolean,
      default: true,
    },

    // Future support
    overtimeAllowed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model(
  "AttendanceSettings",
  AttendanceSettingsSchema
);

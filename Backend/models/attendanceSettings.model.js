import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const AttendanceSettingsSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", unique: true, required: true },

  // Shift configuration
  shiftStartTime: { type: String, default: "09:00" }, // 24h format
  shiftEndTime: { type: String, default: "17:00" },
  requiredHoursPerDay: { type: Number, default: 8 },
  halfDayMinHours: { type: Number, default: 4 },
  graceMinutes: { type: Number, default: 10 }, // late allowed

  // Weekly off
  weeklyOffDays: {
    type: [String], // ["Sunday"]
    default: []
  },

  // Allowed attendance locations
  allowedLocations: [
    {
      name: String,
      lat: Number,
      lng: Number,
      radiusMeters: { type: Number, default: 50 } // 5–100 meters
    }
  ],

  // Optional future features
  overtimeAllowed: { type: Boolean, default: false },
  otAfterHours: { type: Number, default: 8 },

}, { timestamps: true });

module.exports = mongoose.model("AttendanceSettings", AttendanceSettingsSchema);

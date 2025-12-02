import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  companyId: { type: ObjectId, ref: "Company", required: true },

  date: { type: String, index: true }, // "2025-03-30"

  // -------- CHECK-IN DATA --------
  checkIn: {
    time: Date,
    lat: Number,
    lng: Number,
    faceVerified: Boolean,
    confidence: Number, // 0.00 - 1.00
    imageUrl: String, // stored for audit logs

    spoofDetected: { type: Boolean, default: false }, // anti-spoofing
    deviceInfo: String // model, OS
  },

  // -------- CHECK-OUT DATA --------
  checkOut: {
    time: Date,
    lat: Number,
    lng: Number,
    faceVerified: Boolean,
    confidence: Number,
    imageUrl: String,

    spoofDetected: { type: Boolean, default: false },
    deviceInfo: String
  },

  // -------- CALCULATED METRICS --------
  totalHours: Number,
  lateByMinutes: Number,
  earlyLeaveMinutes: Number,
  overtimeHours: Number,

  // -------- ATTENDANCE STATUS --------
  status: {
    type: String,
    enum: [
      "PRESENT_FULL",
      "PRESENT_HALF",
      "ABSENT",
      "WEEKLY_OFF",
      "HOLIDAY",
      "LEAVE_APPROVED",
      "MANUAL_PRESENT"
    ]
  },

  // -------- LEAVE ENTRY --------
  leave: {
    applied: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    type: String,
    approvedBy: { type: ObjectId, ref: "User" }
  },

  // -------- HOLIDAY ENTRY --------
  holidayInfo: {
    isHoliday: { type: Boolean, default: false },
    holidayName: String
  },

  // -------- MANUAL ATTENDANCE --------
  manual: {
    requested: { type: Boolean, default: false },
    reason: String,
    requestedBy: { type: ObjectId, ref: "User" },
    approvedBy: { type: ObjectId, ref: "User" }
  },

  // -------- FRAUD PREVENTION --------
  fraudCheck: {
    gpsMismatch: { type: Boolean, default: false }, // > radius
    repeatedFace: { type: Boolean, default: false }, // same face on multiple users
    suspiciousActivity: String // custom flags
  }

}, { timestamps: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);

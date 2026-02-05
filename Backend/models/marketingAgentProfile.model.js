import mongoose from "mongoose";

const marketingAgentProfileSchema = new mongoose.Schema(
  {
    // 🔗 Reference to human user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    joiningDate: {
      type: Date,

    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESIGNED"],
      default: "ACTIVE"
    },

    // 🌳 Agent Responsibility (MLM summary)
    totalAgentsAssigned: {
      type: Number,
      default: 0
    },
    directAgentsCount: {
      type: Number,
      default: 0
    },

    // 📍 Visit / Attendance Rules
    visitRadiusInMeters: {
      type: Number,
      default: 100
    },
    visitsRequiredPerAgentPerMonth: {
      type: Number,
      default: 4
    },

    // 📆 Monthly Tracking Snapshot
    currentMonth: {
      type: String // YYYY-MM
    },
    totalVisitsRequiredThisMonth: {
      type: Number,
      default: 0
    },
    totalVisitsCompletedThisMonth: {
      type: Number,
      default: 0
    },
    isTargetAchieved: {
      type: Boolean,
      default: false
    },

    // 🧭 Operational Area
    assignedRegion: {
      type: String
    },
    assignedCity: {
      type: String
    },

    // 🧠 Activity Tracking
    lastVisitMarkedAt: {
      type: Date
    },
    lastActiveAt: {
      type: Date
    },
    
  },
  { timestamps: true }
);

export default mongoose.model(
  "MarketingAgentProfile",
  marketingAgentProfileSchema
);

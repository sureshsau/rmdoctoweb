import mongoose from "mongoose";

const agentProfileSchema = new mongoose.Schema(
  {
    // 🔗 Agent reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // Basic Agent Info
    agentName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      index: true
    },

    // 📍 Business Address
    address: {
      type: String,
      default: null
    },
    city: {
      type: String,
      default: null
    },
    state: {
      type: String,
      default: null
    },
    pincode: {
      type: String,
      default: null
    },

    // 📍 GEO LOCATION (for attendance / visits)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },

    // 🪪 KYC DETAILS (handled via separate API)
    aadhaarNumber: {
      type: String,
      default: null
    },
    aadhaarFrontImage: {
      type: String,
      default: null
    },
    aadhaarBackImage: {
      type: String,
      default: null
    },

    panNumber: {
      type: String,
      default: null
    },
    panImage: {
      type: String,
      default: null
    },
    kycStatus: {
      type: String,
      enum: ["NOT SUBMITTED","PENDING", "VERIFIED", "REJECTED"],
      default: "NOT SUBMITTED"
    },
    kycVerifiedAt: {
      type: Date,
      default: null
    },
    kycRejectedReason: {
      type: String,
      default: null
    },
    //MLM FIELDS
    parentAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    level: {
      type: Number,
      default: 0
    },
    directDownlineCount: {
      type: Number,
      default: 0
    },
    totalDownlineCount: {
      type: Number,
      default: 0
    },

    // 🔗 Ownership
    marketingAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🚦 Agent Status
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "INACTIVE"
    },

    // 🧠 Meta
    registeredBy: {
      type: String,
      enum: ["MARKETING_AGENT", "AGENT"],
      required: true
    },
    lastVisitedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);


export default mongoose.model("AgentProfile", agentProfileSchema);

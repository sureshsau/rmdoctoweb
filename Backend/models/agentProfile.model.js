import mongoose from "mongoose";

const agentProfileSchema = new mongoose.Schema(
  {
    // 🔗 OWNER
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // 🧑 BASIC INFO
    agentName: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
    },

    // 📍 ADDRESS
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },

    // 📍 LOCATION
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: null
      }
    },

    // 🪪 KYC (AWS STORED)
    kyc: {
      aadhaarNumber: { type: String, default: null },

      aadhaarFront: {
        url: { type: String, default: null },
        key: { type: String, default: null }
      },

      aadhaarBack: {
        url: { type: String, default: null },
        key: { type: String, default: null }
      },

      panNumber: { type: String, default: null },

      panImage: {
        url: { type: String, default: null },
        key: { type: String, default: null }
      },

      status: {
        type: String,
        enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"],
        default: "NOT_SUBMITTED"
      },

      verifiedAt: { type: Date, default: null },
      rejectedReason: { type: String, default: null }
    },

    // 📄 AGREEMENT / LICENSE (AWS STORED)
    agreement: {
      documentType: {
        type: String,
        enum: ["AGREEMENT", "LICENSE"],
        default: null
      },

      document: {
        url: { type: String, default: null },
        key: { type: String, default: null }
      },

      uploadedAt: { type: Date, default: null },

      verificationStatus: {
        type: String,
        enum: ["NOT_UPLOADED", "PENDING", "APPROVED", "REJECTED"],
        default: "NOT_UPLOADED"
      },

      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      verifiedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: null }
    },

    // 🔗 ONBOARDING
    registeredBy: {
      type: String,
      enum: ["admin", "subadmin", "marketing_agent"],
      required: true
    },

    // 🚦 STATUS
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "INACTIVE"
    },

    lastVisitedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// GEO INDEX
agentProfileSchema.index({ location: "2dsphere" });

export default mongoose.model("AgentProfile", agentProfileSchema);

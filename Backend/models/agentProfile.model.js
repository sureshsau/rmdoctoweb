import mongoose from "mongoose";

const agentProfileSchema = new mongoose.Schema(
  {
    /* ==========================
       🔗 OWNER
    ========================== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    /* ==========================
       🌳 MLM HIERARCHY
    ========================== */
    parentAgentId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentProfile",
      default: null,
      index: true
    },
    // Immediate parent (can be marketing_agent or agent)
    childAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentProfile",
      default: null,
      index: true
    },

    // Root marketing agent of this tree
    marketingAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    // Depth in tree (root = 0)
    level: {
      type: Number,
      default: 0,
      index: true
    },

    // Cached counts (for fast queries)
    directDownlineCount: {
      type: Number,
      default: 0
    },

    totalDownlineCount: {
      type: Number,
      default: 0
    },



    /* ==========================
       🪪 KYC (AWS STORED)
    ========================== */
    kycDocuments: [
      {
        documentType: { type: String, required: true },
        documentNumber: { type: String, default: null },
        file: {
          url: { type: String, required: true },
          key: { type: String, required: true }
        },
        status: {
          type: String,
          enum: ["UPLOADED", "PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING"
        },
        uploadedAt: { type: Date, default: Date.now },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        verifiedAt: { type: Date, default: null },
        rejectionReason: { type: String, default: null }
      }
    ],



    /* ==========================
       🔗 ONBOARDING
    ========================== */
    registeredBy: {
      type: String,
      enum: ["admin", "subadmin", "marketing_agent", "agent"],
      required: true
    },

    /* ==========================
    ========================== */
    status: {
      type: String,
      enum: ["VERIFIED","NOTVERIFIED"],
      default: "VERIFIED"
    },

    lastVisitedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Indexes
agentProfileSchema.index({ location: "2dsphere" });

export default mongoose.model("AgentProfile", agentProfileSchema);

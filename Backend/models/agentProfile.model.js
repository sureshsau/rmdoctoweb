import mongoose from "mongoose";

const agentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    /* 🌳 MLM HIERARCHY */
    parentAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentProfile",
      default: null,
      index: true
    },

    childAgentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"AgentProfile",
        index: true
      }
    ],

    marketingAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    level: {
      type: Number,
      default: 0,
      index: true
    },

    /*  CACHED COUNTS */
    directDownlineCount: {
      type: Number,
      default: 0
    },

    totalDownlineCount: {
      type: Number,
      default: 0
    },
  
    /* 🪪 KYC */
    // kycDocuments: [ /* unchanged */ ],

    registeredBy: {
      type: String,
      enum: ["AGENT", "SUBADMIN", "MARKETING_AGENT", "ADMIN"],
      default:"ADMIN"
    },
    status: {
      type: String,
      enum: ["VERIFIED", "NOTVERIFIED"],
      default: "VERIFIED"
    },

    lastVisitedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const AgentProfile=mongoose.model("AgentProfile",agentProfileSchema);
export default AgentProfile
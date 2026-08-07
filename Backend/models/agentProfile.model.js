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
    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    kycDocuments: [{
      url: { type: String },
      documentType: { type: String }
    }],

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

    /* 🏪 SHOP DETAILS
       Captured at registration. The meet/visit screens route a marketing
       executive to the shop, so the address lives on the profile rather than
       only on the user account — a member can move shop without the login
       address changing. */
    shopName: { type: String, trim: true, default: null },

    shopImage: {
      url: { type: String, default: null },
      key: { type: String, default: null },
      bucket: { type: String, default: null },
      updatedAt: { type: Date, default: null }
    },

    address: { type: String, default: null },
    landmark: { type: String, default: null },
    city: { type: String, default: null, index: true },
    district: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null, index: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined
      }
    },

    /* 📅 MEET CADENCE — how often this shop is supposed to be visited */
    visitFrequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY"],
      default: "MONTHLY",
      index: true
    },

    lastVisitedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Powers the "search a location → every RM member on that route" lookup
agentProfileSchema.index({ location: "2dsphere" });

const AgentProfile=mongoose.model("AgentProfile",agentProfileSchema);
export default AgentProfile
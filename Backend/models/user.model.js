import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // BASIC IDENTITY
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, index: true, sparse: true },
    phone: { type: String, required: true, index: true },


    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },

    /* ==========================
       📍 LOCATION
    ========================== */
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

    // AUTHENTICATION
    passwordHash: { type: String },

    // ACCOUNT STATUS
    isActive: { type: Boolean, default:true },
    isBlocked: { type: Boolean, default: false },

    // DASHBOARD TYPE (UI routing only)
    dashboard: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "employee",
        "agent",
        "marketing_agent",
        "receptionist",
        "user",
      ],
      default: "user",
    },

    // RBAC (BACKEND AUTHORIZATION)
    roles: {
      type: [String], // e.g. ["doctor", "receptionist"]
      default: [],
      index: true,
    },

    permissions: {
      type: [String], // e.g. ["appointment.create", "patient.read"]
      default: [],
    },

    // PROFILE LINKS
    profiles: {
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorProfile" },
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "EmployeeProfile" },
      agentId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentProfile" },
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientProfile" },
      receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: "ReceptionistProfile" },
      labOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "LabProfile" },
      marketing_agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MarketingAgentProfile",
      },
    },

    // SESSION CONTROL
    tokenVersion: { type: Number, default: 0 },
    webSessionVersion: { type: Number, default: 0 },
    appSessionVersion: { type: Number, default: 0 },

    // DEVICE INFO
    lastLoginAt: { type: Date },
    lastLoginIP: { type: String },
    lastLoginDevice: { type: String },
    firstLoginIP: { type: String },
    firstDevice: { type: String },

    // KYC
    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    kycDocuments: [{ url: String, type: String }],

    // SECURITY
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // NOTIFICATIONS
    pushToken: { type: String },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);

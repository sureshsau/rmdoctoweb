import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    

    // BASIC IDENTITY
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, index: true, sparse: true },
    phone: { type: String, required: true, index: true },

    // AUTHENTICATION
    passwordHash: { type: String },

    // ACCOUNT STATUS
    isActive: { type: Boolean, default: false }, // true only after approval
    isBlocked: { type: Boolean, default: false }, // admin can block account

    // DEFAULT USER TYPE (controls UI only — NOT permissions)
    userType: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "employee",
        "agent",
        "marketing_agent",
        "receptionist",
        "patient",
        "user", // new users waiting for approval
      ],
      default: "user",
    }, 

    // PROFILE LINKS (business data)
    profiles: {
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorProfile" },
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmployeeProfile",
      },
      agentId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentProfile" },
      patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
      },
      receptionistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReceptionistProfile",
      },
      labOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "LabProfile" },
      marketing_agentId:{
        type:mongoose.Schema.Types.ObjectId,ref:"MarketingAgentProfile"
      }
    },

    // RBAC: Extra user-level permissions (rare cases)
    userSpecificPermissions: [{ type: String }],

    // SESSION CONTROL – Single login per device type
    tokenVersion: { type: Number, default: 0 }, // global invalidate
    webSessionVersion: { type: Number, default: 0 }, // web session
    appSessionVersion: { type: Number, default: 0 }, // mobile session

    // DEVICE INFO (optional but recommended)
    // lastLoginAt:    { type: Date },
    // lastLoginIP:    { type: String },
    // lastLoginDevice: { type: String }, // "web", "android", "ios"
    lastLoginAt: { type: Date },
    lastLoginIP: { type: String },
    lastLoginDevice: { type: String },

    firstLoginIP: { type: String },
    firstDevice: { type: String },

    devices: [
      {
        ip: String,
        device: String,
        loggedInAt: { type: Date, default: Date.now },
      },
    ],

    // KYC + APPROVALS
    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    kycDocuments: [
      {
        url: String,
        type: String,
      },
    ],

    // SECURITY FEATURES
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }, // temporary block after too many attempts

    // NOTIFICATIONS
    pushToken: { type: String }, // mobile push notifications
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

let USER = mongoose.model("User", UserSchema);
export default USER;
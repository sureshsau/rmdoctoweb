import mongoose from "mongoose";
import { generateUserRmdId } from "../utils/rmdId.js";

/* One entry per device the user is signed in on. FCM issues a token per
   app-install, so a user with a phone and a tablet has two. */
const deviceTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    platform: {
      type: String,
      enum: ["android", "ios", "web"],
      default: "android",
    },
    deviceId: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // BASIC IDENTITY
    // Public human-readable id (RMD000142) carried by every patient and staff
    // member. Assigned via utils/rmdId.js; sparse so pre-existing users stay
    // valid until the backfill runs.
    rmdId: { type: String, unique: true, sparse: true, index: true, trim: true },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, index: true, sparse: true },
    phone: { type: String, required: true, index: true },


    address: { type: String, default: null },
    landmark: { type: String, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },
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

    savedAddresses: [
      {
        label: { type: String, enum: ["Home", "Office", "Other"], default: "Other" },
        addressLine1: { type: String, required: true },
        pincode: { type: String, required: true },
        source: { type: String, enum: ["GPS", "MANUAL"], default: "MANUAL" },
        location: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], default: [0, 0] }
        },
      }
    ],

    // AUTHENTICATION
    passwordHash: { type: String },

    // ACCOUNT STATUS
    isActive: { type: Boolean, default: true },
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
        "rmrider",
        "lab_technician",
        "typist"
      ],
      default: "user",
    },

    // RBAC (BACKEND AUTHORIZATION)
    roles: {
      type: [String], // e.g. ["doctor", "receptionist"]
      default: [],
      index: true,
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
      riderId: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile" },
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
    kycDocuments: [{
      url: { type: String },
      documentType: { type: String }
    }],
    bankDetails: {
      accountNumber: { type: String, default: null },
      ifscCode: { type: String, default: null },
      accountHolderName: { type: String, default: null },
      bankName: { type: String, default: null }
    },

    // FACE IMAGE (avatar)
    faceImage: {
      url: { type: String, default: null },
      bucket: { type: String, default: null },
      key: { type: String, default: null },
      updatedAt: { type: Date, default: null }
    },
    rmCoinsBalance: {
      type: Number,
      default: 0,
      min: 0
    },

    // SECURITY
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // NOTIFICATIONS
    pushToken: { type: String },
    fcmTokens: { type: [deviceTokenSchema], default: [] },
  },
  { timestamps: true }
);

// Lets us find (and steal) a device token that is still attached to a previous
// account when someone else logs in on the same phone.
UserSchema.index({ "fcmTokens.token": 1 });

// Every human -- patient, doctor, agent, rider, admin-created staff, everyone
// -- gets an RMD<NNNNNN> id the moment their account row is inserted, instead
// of relying on each creation call site to remember to assign one.
UserSchema.pre("save", async function () {
  if (this.isNew && !this.rmdId) {
    this.rmdId = await generateUserRmdId();
  }
});

export default mongoose.model("User", UserSchema);

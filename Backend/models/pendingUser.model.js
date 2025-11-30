import mongoose  from "mongoose";

const PendingRoleRequestSchema = new mongoose.Schema({

  // WHICH USER
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // USER SELECTS ONLY ONE CORE ROLE
  requestedCoreRole: {
    type: String,
    enum: [
      "doctor",
      "employee",
      "agent",
      "receptionist",
      "marketing_agent",
      "lab_staff",
      "patient"
    ],
    required: true
  },

  // USER CAN SELECT MANY DYNAMIC ROLES
  requestedDynamicRoleIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    }
  ],

  // Additional profile info for core roles
  profileData: {
    specialization: String,
    registrationNumber: String,
    experience: Number,
    department: String,
    employeeType: String,
    referralCode: String
  },

  // Documents if needed
  documents: [
    {
      type: { type: String },
      url: String,
      verified: { type: Boolean, default: false }
    }
  ],

  // Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "partially_approved"],
    default: "pending",
    index: true
  },

  // Admin's selective approvals
  approvedDynamicRoleIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Role" }
  ],
  rejectedDynamicRoleIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Role" }
  ],

  reason: String,

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,

  history: [
    {
      status: String,
      note: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date, default: Date.now }
    }
  ]

}, { timestamps: true });


const PENDINGUSER= mongoose.model("PendingRoleRequest", PendingRoleRequestSchema);


export default PENDINGUSER;
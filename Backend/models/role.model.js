import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    // Multi-company support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null
    },
    // Machine readable unique key (VERY IMPORTANT)
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,    // "doctor", "receptionist", "lab_manager"
      trim: true
    },

    // Human readable name
    name: { type: String, required: true, trim: true },

    description: { type: String, default: "" },

    // ALL permissions
    permissions: [{ type: String, required: true }],

    // December: Role Category
    roleType: {
      type: String,
      enum: ["core", "custom"],
      default: "custom"
    },

    // ⭐ NEW: Tell backend which profile to create
    coreProfile: {
      type: String,
      enum: [
        "doctor",
        "employee",
        "agent",
        "marketing_agent",
        "receptionist",
        "patient",
        "lab_owner",
        null
      ],
      default: null
    },

    isDefault: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Role", RoleSchema);

import mongoose from "mongoose";
const RoleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null
  },

  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },

  // permissions bucket
  permissions: [{ type: String, required: true }],

  // category (completely flexible)
  roleType: {
    type: String,
    default: "custom"
  },

  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
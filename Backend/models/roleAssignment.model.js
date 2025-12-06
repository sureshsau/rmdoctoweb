import mongoose from "mongoose";
const RoleAssignmentSchema = new mongoose.Schema({

  // WHO receives the role
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // WHICH role is assigned
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true
  },

  // SCOPE OF ROLE (real enterprise RBAC)
  scope: {
    type: String,
    default: "company"  // company-level role by default
  },

  // SCOPE ID → used only when scope = branch / lab / department
  scopeId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // TEMPORARY ROLES
  expiresAt: {
    type: Date,
    default: null     // null = permanent role
  },

  // WHO assigned this role?
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  active: {
    type: Boolean,
    default: true
  },

}, { timestamps: true });

const ROLEASSIGNMENTS = mongoose.model("RoleAssignment", RoleAssignmentSchema);
export default ROLEASSIGNMENTS;
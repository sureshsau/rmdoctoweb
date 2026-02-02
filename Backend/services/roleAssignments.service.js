// services/roleAssignment.service.js
import ROLE from "../models/role.model.js";
import RoleAssignment from "../models/roleAssignment.model.js";
import User from "../models/user.model.js";
import DoctorProfile from "../models/doctorProfile.schema.js";
import Role from '../models/role.model.js';
import MarketingAgentProfile from "../models/marketingAgentProfile.model.js";

import AppError from "../utils/AppError.js";
import { createAttendanceSetting } from "./attendance.service.js";
import agentProfile from "../models/agentProfile.model.js";

/**
 * Merge permissions from RoleAssignments + userSpecificPermissions
 * and save into User.permissionsCached & User.rolesCached.
*/
export async function rebuildUserPermissions(userId) {
  const assignments = await RoleAssignment.find({ userId, active: true }).populate("roleId", "key permissions coreProfile");

  const permSet = new Set();
  const rolesCached = [];

  for (const a of assignments) {
    if (!a.roleId) continue;
    rolesCached.push(a.roleId.key);
    (a.roleId.permissions || []).forEach(p => permSet.add(p));
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (Array.isArray(user.userSpecificPermissions)) {
    user.userSpecificPermissions.forEach(p => permSet.add(p));
  }

  user.rolesCached = rolesCached;
  user.permissionsCached = [...permSet];

  await user.save();
  return { roles: rolesCached, permissions: [...permSet] };
}

/**
 * Helper to create core profile if role.coreProfile is defined and
 * the user doesn't already have that profile.
 * Returns created profileId or null if none created.
 *
 * NOTE: keep minimal fields; HR/admin will update profile later.
 */
async function ensureCoreProfileForUser(user, role) {
  const map = {
    doctor: "doctorId",
    employee: "employeeId",
    agent: "agentId",
    marketing_agent: "marketing_agentId",
    receptionist: "receptionistId",
    patient: "patientId",
  };

  const profileKey = map[role];
  if (!profileKey) return;

  // ✅ Ensure profiles object exists
  if (!user.profiles) {
    user.profiles = {};
  }

  // ✅ Model map (keys MUST match profileKey)
  const ModelMap = {
    doctorId: DoctorProfile,
    agentId: agentProfile,
    marketing_agentId: MarketingAgentProfile,
  };

  const ProfileModel = ModelMap[profileKey];
  if (!ProfileModel) return;

  if (!user.profiles[profileKey]) {
    const profile = await ProfileModel.create({
      userId: user._id,
    });

    user.profiles[profileKey] = profile._id;
  }
}


/**
 * Assign a single role to a user (idempotent).
 * It creates a RoleAssignment document and triggers permission rebuild.
 * It will auto-create core profile if required.
 */
export async function assignRoleService({
  userId,
  roles = [],
  permissions = [],
  dashboard = "user",
}) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Merge roles (avoid duplicates)
  if (roles.length) {
    user.roles = Array.from(new Set([...user.roles, ...roles]));
  }

  // Merge permissions (avoid duplicates)
  if (permissions.length) {
    user.permissions = Array.from(
      new Set([...user.permissions, ...permissions])
    );
  }

  // Update dashboard (UI only)
  if (dashboard) {
    user.dashboard = dashboard;
  }

  // Auto-create core profiles based on roles
  for (const role of roles) {
    await ensureCoreProfileForUser(user, role);
  }

  await user.save();

  return user;
}


/**
 * Assign multiple roles to a user in one call.
 * Accepts roleIds array. Skips duplicates.
 */
export async function assignMultipleRolesService({ userId, roleIds = [], scope = "company", scopeId = null, grantedBy }) {
  if (!Array.isArray(roleIds) || roleIds.length === 0) throw new AppError("roleIds array required", 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const assignments = [];
  for (const roleId of roleIds) {
    const role = await ROLE.findById(roleId);
    if (!role) continue; // skip invalid roleId silently or optionally collect errors

    const exists = await RoleAssignment.findOne({ userId, roleId, scope, scopeId, active: true });
    if (exists) {
      assignments.push(exists);
      continue;
    }

    const a = await RoleAssignment.create({ userId, roleId, scope, scopeId, grantedBy, active: true });
    assignments.push(a);

    // create core profile if needed
    await ensureCoreProfileForUser(user, role);
  }

  await user.save();
  await rebuildUserPermissions(userId);

  return assignments;
}

/**
 * Deactivate (soft remove) an assignment
 */
export async function deactivateRoleService(assignmentId) {
  const assignment = await RoleAssignment.findById(assignmentId);
  if (!assignment) throw new AppError("Assignment not found", 404);
  if (!assignment.active) return assignment;

  assignment.active = false;
  await assignment.save();

  await rebuildUserPermissions(assignment.userId);
  return assignment;
}

/**
 * Remove role from user by roleId (soft deactivate)
 */
export async function removeRoleService({ userId, roleId }) {
  const assignment = await RoleAssignment.findOne({ userId, roleId, active: true });
  if (!assignment) throw new AppError("Role assignment not found", 404);

  assignment.active = false;
  await assignment.save();

  await rebuildUserPermissions(userId);
  return assignment;
}

/**
 * Bulk assign role to many users (for CSV imports etc.)
 */
export async function bulkAssignRoleService({ roleId, users = [], scope = "company", scopeId = null, grantedBy }) {
  if (!Array.isArray(users) || users.length === 0) throw new AppError("Users array required", 400);
  const role = await ROLE.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  const created = [];
  for (const userId of users) {
    // skip if user missing
    const user = await User.findById(userId);
    if (!user) continue;

    const exists = await RoleAssignment.findOne({ userId, roleId, scope, scopeId, active: true });
    if (exists) { created.push(exists); continue; }

    const a = await RoleAssignment.create({ userId, roleId, scope, scopeId, grantedBy, active: true });
    created.push(a);

    await ensureCoreProfileForUser(user, role);
    await user.save();
    await rebuildUserPermissions(userId);
  }

  return created;
}


export const getRolesAndPermissionsById = async (userId) => {
  try {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await User.findById(userId)
      .select("roles permissions dashboard")
      .lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      roles: user.roles || [],
      permissions: user.permissions || [],
      dashboard: user.dashboard || "user",
    };
  } catch (err) {
    console.error("Error fetching roles/permissions:", err);
    throw err instanceof AppError
      ? err
      : new AppError(
          "Internal server error while fetching roles & permissions",
          500
        );
  }
};



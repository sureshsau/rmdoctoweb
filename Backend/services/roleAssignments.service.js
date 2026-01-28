// services/roleAssignment.service.js
import ROLE from "../models/role.model.js";
import RoleAssignment from "../models/roleAssignment.model.js";
import User from "../models/user.model.js";
import DoctorProfile from "../models/doctorProfile.schema.js";
import Role from '../models/role.model.js';
import MarketingAgentProfile from "../models/marketingAgentProfile.model.js";

import AppError from "../utils/AppError.js";
import { createAttendanceSetting } from "./attendance.service.js";

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

  if (!role.coreProfile) return null;

  const cp = role.coreProfile;
  console.log(cp);

  // doctor
  if (cp == "doctor" && !user.profiles.doctorId) {
    console.log('creating doctor')
    const d = await DoctorProfile.create({ userId: user._id, companyId: user.companyId });
    user.profiles.doctorId = d._id;
    user.userType="doctor";
    return d._id;
  }

  // agent
  if ((cp === "marketing_agent") && !user.profiles.marketing_agent) {
    console.log('creating profile')
    const a = await MarketingAgentProfile.create({ userId: user._id });
    user.profiles.marketing_agentId = a._id;
    user.userType="marketing_agent";
    return a._id;
  }

  // receptionist/employee -> use EmployeeProfile
//   if ((cp === "receptionist" || cp === "employee") && !user.profiles.employeeId) {
//     const e = await EmployeeProfile.create({
//       userId: user._id,
//       companyId: user.companyId,
//       employeeType: cp
//     });
//     user.profiles.employeeId = e._id;
//     return e._id;
//   }

  // lab_owner
//   if (cp === "lab_owner" && !user.profiles.labOwnerId) {
//     // LabProfile model assumed as LabProfile
//     const l = await (await import("../models/labProfile.model.js")).default.create({ userId: user._id, companyId: user.companyId });
//     user.profiles.labOwnerId = l._id;
//     return l._id;
//   }

  return null;
}

/**
 * Assign a single role to a user (idempotent).
 * It creates a RoleAssignment document and triggers permission rebuild.
 * It will auto-create core profile if required.
 */
export async function assignRoleService({ userId, roleId, scope = "company", scopeId = null, grantedBy }) {
  // validate user exists
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const role = await ROLE.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  const existing = await RoleAssignment.findOne({ userId, roleId, scope, scopeId, active: true });
  if (existing) {
    throw new AppError('this role already given to user',400)
  }

  // Create assignment
  const assignment = await RoleAssignment.create({
    userId, roleId, scope, scopeId, grantedBy, active: true
  });

  // Auto-create core profile (if role is core and profile absent)
  await ensureCoreProfileForUser(user, role);
  await user.save();

  // Rebuild permissions cache
  await rebuildUserPermissions(userId);

  return assignment;
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
    if (!userId)
      throw new AppError("User ID is required", 400);

    // One optimized query → JOIN roles directly
    const assignments = await RoleAssignment.find({ userId, active: true })
      .populate("roleId", "key permissions")
      .lean();

    // No roles? Return empty values
    if (!assignments || assignments.length === 0) {
      return { roles: [], permissions: [] };
    }

    const roles = [];
    const permSet = new Set();

    // Process assignments
    for (const a of assignments) {
      if (!a.roleId) continue;

      roles.push(a.roleId.key);

      // Add permissions into Set (avoid duplicates)
      for (const p of a.roleId.permissions) {
        permSet.add(p);
      }
    }

    return {
      roles,
      permissions: [...permSet] // flatten unique permissions
    };

  } catch (err) {
    console.error("Error fetching roles/permissions:", err);
    throw new AppError(
      "Internal server error while fetching roles & permissions",
      500
    );
  }
};


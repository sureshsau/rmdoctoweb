// services/roleAssignment.service.js
import ROLE from "../models/role.model.js";
import RoleAssignment from "../models/roleAssignment.model.js";
import User from "../models/user.model.js";
import DoctorProfile from "../models/doctorProfile.schema.js";
import Role from '../models/role.model.js';
import MarketingAgentProfile from "../models/marketingAgentProfile.model.js";


import AppError from "../utils/AppError.js";
import { createAttendanceSetting } from "./attendance.service.js";
import AgentProfile from "../models/agentProfile.model.js";

// Maps a role key → the dashboard value it should trigger
const ROLE_DASHBOARD_MAP = {
  admin: "admin",
  subadmin: "admin",
  doctor: "doctor",
  employee: "employee",
  agent: "agent",
  marketing_agent: "marketing_agent",
  receptionist: "receptionist",
  rmrider: "rmrider",
};

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


export async function ensureCoreProfileForUser(user, role) {
  const profileMap = {
    doctor: {
      key: "doctorId",
      model: DoctorProfile,
      build: () => ({
        userId: user._id,
        doctorName: user.name,
        phone: user.phone,
        registeredBy: "admin",
      }),
    },

    agent: {
      key: "agentId",
      model: AgentProfile,
      build: () => ({
        userId: user._id,
        agentName: user.name,
        phone: user.phone,
        registeredBy: "ADMIN",
      }),
    },

    marketing_agent: {
      key: "marketing_agentId",
      model: MarketingAgentProfile,
      build: () => ({
        userId: user._id,
        agentName: user.name,
        phone: user.phone,
        registeredBy: "admin",
      }),
    },
  };

  const config = profileMap[role];
  if (!config) return;

  const { key, model: ProfileModel, build } = config;

  if (!user.profiles) user.profiles = {};

  // ✅ Already linked → done
  if (user.profiles[key]) return;

  let profile;

  try {
    // 1️⃣ Try finding existing profile
    profile = await ProfileModel.findOne({ userId: user._id });

    // 2️⃣ Create only if not exists
    if (!profile) {
      profile = await ProfileModel.create(build());
    }
  } catch (err) {
    // 3️⃣ Handle race-condition duplicate key
    if (err.code === 11000) {
      profile = await ProfileModel.findOne({ userId: user._id });
    } else {
      throw err;
    }
  }

  if (!profile) return;

  // 4️⃣ Attach profile safely
  user.profiles[key] = profile._id;

  await user.save();
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
  if (roles.includes("admin")) {
    throw new AppError("Admin role cannot be assigned", 403);
  }
  // Merge permissions (avoid duplicates)
  if (permissions.length) {
    user.permissions = Array.from(
      new Set([...user.permissions, ...permissions])
    );
  }

  // Auto-resolve dashboard from roles first, fall back to explicit dashboard param
  const autoDashboard = roles
    .map((r) => ROLE_DASHBOARD_MAP[r])
    .find(Boolean);

  if (autoDashboard) {
    user.dashboard = autoDashboard;
  } else if (dashboard && dashboard !== "user") {
    // Only override with explicit value when it's not the generic default
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



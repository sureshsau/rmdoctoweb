// controllers/roleAssignment.controller.js
import {
  assignRoleService,
  assignMultipleRolesService,
  removeRoleService,
  deactivateRoleService,
  rebuildUserPermissions,
  bulkAssignRoleService
} from "../services/roleAssignments.service.js";
import AppError from "../utils/AppError.js";

// assign single role
export const assignRole = async (req, res, next) => {
  try {
    const { userId, roles, permissions, dashboard } = req.body;

    if (!userId) {
      return next(new AppError("userId is required", 400));
    }

    const updatedUser = await assignRoleService({
      userId,
      roles,
      permissions,
      dashboard,
    });

    return res.status(200).json({
      success: true,
      message: "Roles and permissions updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};


// assign many roles at once
export const assignMultipleRoles = async (req, res, next) => {
  try {
    const { userId, roleIds, scope, scopeId } = req.body;
    if (!userId || !Array.isArray(roleIds)) return next(new AppError("userId and roleIds[] required", 400));

    const assignments = await assignMultipleRolesService({ userId, roleIds, scope, scopeId, grantedBy: req.user.id });

    return res.status(201).json({ success: true, message: "Roles assigned", data: assignments });
  } catch (err) { next(err); }
};

// remove role
export const removeRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) return next(new AppError("userId and roleId required", 400));

    const removed = await removeRoleService({ userId, roleId });
    return res.json({ success: true, message: "Role removed", data: removed });
  } catch (err) { next(err); }
};

// deactivate assignment
export const deactivateAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.body;
    if (!assignmentId) return next(new AppError("assignmentId required", 400));

    const result = await deactivateRoleService(assignmentId);
    return res.json({ success: true, message: "Assignment deactivated", data: result });
  } catch (err) { next(err); }
};

// bulk assign (many users)
export const bulkAssignRole = async (req, res, next) => {
  try {
    const { roleId, users } = req.body;
    if (!roleId || !Array.isArray(users)) return next(new AppError("roleId and users[] required", 400));

    const created = await bulkAssignRoleService({ roleId, users, grantedBy: req.user.id });
    return res.json({ success: true, message: "Bulk assign completed", data: created });
  } catch (err) { next(err); }
};

// rebuild permissions for a user (admin)
export const rebuildPermissionsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) return next(new AppError("userId required", 400));

    const result = await rebuildUserPermissions(userId);
    return res.json({ success: true, message: "Permissions rebuilt", data: result });
  } catch (err) { next(err); }
};

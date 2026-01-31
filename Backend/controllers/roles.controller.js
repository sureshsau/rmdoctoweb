import {
  createRoleService,
  getAllRolesService,
  getRoleByIdService,
  updateRoleService,
  deleteRoleService
} from "../services/role.service.js";

import AppError from "../utils/AppError.js";

// --------------------------------------
// CREATE ROLE
// --------------------------------------


export const createRole = async (req, res, next) => {
  try {
    const { key, name, permissions } = req.body;

    if (!key) return next(new AppError("Role key is required", 400));
    if (!name) return next(new AppError("Role name is required", 400));
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return next(new AppError("At least one permission is required", 400));
    }

    const role = await createRoleService({
      key,
      name,
      permissions,
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------
// GET ALL ROLES
// --------------------------------------
export const getAllRolesController = async (req, res, next) => {
  try {
    const roles = await getAllRolesService();

    return res.json({
      success: true,
      count: roles.length,
      data: roles
    });

  } catch (err) {
    throw new AppError("Internal server error",500);
  }
};



// --------------------------------------
// GET ROLE BY ID
// --------------------------------------
export const getRoleById = async (req, res, next) => {
  try {
    const role = await getRoleByIdService(req.params.roleId);

    return res.json({
      success: true,
      data: role
    });

  } catch (err) {
    next(err);
  }
};



// --------------------------------------
// UPDATE ROLE
// --------------------------------------
export const updateRole = async (req, res, next) => {
  try {
    const updated = await updateRoleService(req.params.roleId, req.body);

    return res.json({
      success: true,
      message: "Role updated successfully",
      data: updated
    });

  } catch (err) {
    next(err);
  }
};



// --------------------------------------
// DELETE ROLE
// --------------------------------------
export const deleteRole = async (req, res, next) => {
  try {
    await deleteRoleService(req.params.roleId);

    return res.json({
      success: true,
      message: "Role deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};

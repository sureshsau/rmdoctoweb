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
    const {
      key,
      name,
      description,
      permissions,
      roleType,
      coreProfile
    } = req.body;

    // -------------------------
    // BASIC VALIDATIONS
    // -------------------------
    if (!key) return next(new AppError("Role key is required", 400));
    if (!name) return next(new AppError("Role name is required", 400));
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return next(new AppError("At least one permission is required", 400));
    }

    // -------------------------
    // CREATE ROLE USING SERVICE
    // -------------------------
    const role = await createRoleService({
      companyId: req.user?.companyId || null,   // for now null, later dynamic
      key,
      name,
      description,
      permissions,
      roleType,
      coreProfile,
      createdBy: "692d2b1348c59e839af3b3fa"
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role
    });

  } catch (err) {
    next(err);
  }
};




// --------------------------------------
// GET ALL ROLES
// --------------------------------------
export const getRoles = async (req, res, next) => {
  try {
    const roles = await getAllRolesService(req.user.companyId);

    return res.json({
      success: true,
      count: roles.length,
      data: roles
    });

  } catch (err) {
    next(err);
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

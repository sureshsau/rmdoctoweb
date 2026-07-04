import ROLE from "../models/role.model.js";
import AppError from "../utils/AppError.js";
import { ROLE_PERMISSIONS } from "../config/rolePermissions.js";

// --------------------------------------
// CREATE ROLE
// --------------------------------------
export async function createRoleService({ key, name, permissions }) {
  throw new AppError("Roles are statically configured in the backend and cannot be created dynamically.", 403);
}





// --------------------------------------
// GET ALL ROLES
// --------------------------------------
export async function getAllRolesService() {
  try {
    const rolesData = await ROLE.find()
      .select("key name")
      .lean();

    return rolesData.map(role => ({
      ...role,
      permissions: ROLE_PERMISSIONS[role.key] || []
    }));
  } catch (err) {
    throw new AppError("Internal server error", 500);
  }
}


// --------------------------------------
// GET ROLE BY ID
// --------------------------------------
export async function getRoleByIdService(roleId) {
  const role = await ROLE.findById(roleId).lean();
  if (!role) throw new AppError("Role not found", 404);
  role.permissions = ROLE_PERMISSIONS[role.key] || [];
  return role;
}



// --------------------------------------
// UPDATE ROLE
// --------------------------------------
export async function updateRoleService(roleId, data) {
  throw new AppError("Roles and permissions are now statically configured in the backend and cannot be updated dynamically.", 403);
}



// --------------------------------------
// DELETE ROLE
// --------------------------------------
export async function deleteRoleService(roleId) {
  throw new AppError("Roles are statically configured in the backend and cannot be deleted dynamically.", 403);
}

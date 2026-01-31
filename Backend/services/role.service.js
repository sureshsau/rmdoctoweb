import ROLE from "../models/role.model.js";
import AppError from "../utils/AppError.js";

// --------------------------------------
// CREATE ROLE
// --------------------------------------
export async function createRoleService({ key, name, permissions }) {
  key = key.trim().toLowerCase();

  const exists = await ROLE.findOne({ key });
  if (exists) {
    throw new AppError("Role with this key already exists", 409);
  }

  try {
    const role = await ROLE.create({
      key,
      name: name.trim(),
      permissions,
    });

    return role;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("Duplicate role key", 409);
    }
    throw new AppError("Error creating role", 500);
  }
}





// --------------------------------------
// GET ALL ROLES
// --------------------------------------
export async function getAllRolesService() {
  try {
    const rolesData = await ROLE.find()
      .select("key name permissions")
      .lean();

    return rolesData;
  } catch (err) {
    throw new AppError("Internal server error", 500);
  }
}


// --------------------------------------
// GET ROLE BY ID
// --------------------------------------
export async function getRoleByIdService(roleId) {
  const role = await ROLE.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);
  return role;
}



// --------------------------------------
// UPDATE ROLE
// --------------------------------------
export async function updateRoleService(roleId, data) {
  const role = await ROLE.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  Object.assign(role, data);
  await role.save();
  return role;
}



// --------------------------------------
// DELETE ROLE
// --------------------------------------
export async function deleteRoleService(roleId) {
  const role = await ROLE.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);
  await ROLE.deleteOne({ _id: roleId });
}

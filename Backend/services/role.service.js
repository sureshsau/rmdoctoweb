import ROLE from "../models/role.model.js";
import AppError from "../utils/AppError.js";

// --------------------------------------
// CREATE ROLE
// --------------------------------------
export async function createRoleService({
  key,
  name,
  description,
  permissions,
  roleType,
  coreProfile,
  createdBy,
  companyId = null
}) {

  // -----------------------------
  // VALIDATION
  // -----------------------------
  if (!key) {
    throw new AppError("Role key is required (e.g., doctor, receptionist)", 400);
  }

  if (!name) {
    throw new AppError("Role name is required", 400);
  }

  if (!permissions || permissions.length === 0) {
    throw new AppError("At least one permission is required", 400);
  }
  // Normalize key
  key = key.trim().toLowerCase();

  // -----------------------------
  // CHECK DUPLICATE ROLE (KEY)
  // Each company can define roles with same key
  // but global keys in core roles should be unique
  // -----------------------------
  const exists = await ROLE.findOne({
    key,
    companyId: companyId || null
  });

  if (exists) {
    throw new AppError("Role with this key already exists", 409);
  }

  // -----------------------------
  // VALIDATE coreProfile
  // ONLY core roles should have coreProfile
  // -----------------------------
  const VALID_CORE_PROFILES = [
    "doctor",
    "employee",
    "agent",
    "marketing_agent",
    "receptionist",
    "patient",
    "lab_owner"
  ];

  if (coreProfile) {
    if (!VALID_CORE_PROFILES.includes(coreProfile)) {
      throw new AppError("Invalid coreProfile value", 400);
    }
    // auto enforce core roleType
    roleType = "core";
  }


  // -----------------------------
  // CREATE ROLE
  // -----------------------------
  try {
    const role = await ROLE.create({
      companyId,
      key,
      name,
      description,
      permissions,
      roleType: roleType || "custom",
      coreProfile: coreProfile || null,
      createdBy
    });

    return role;

  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      throw new AppError("Duplicate key found", 409);
    }
    throw new AppError("Database error creating role", 500);
  }
}




// --------------------------------------
// GET ALL ROLES
// --------------------------------------
export async function getAllRolesService() {
  try{
    const rolesData=await ROLE.find().select("key coreProfile roleType permissions").lean();
    return rolesData;
  }catch(err){
    throw new AppError("Internal server error",)
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

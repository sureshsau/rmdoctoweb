import User from "../models/user.model.js";
import { hashPassword } from "../utils/password.js";
import { assignRoleService } from "./roleAssignments.service.js";

export const createUserService = async ({
  name,
  email,
  phone,
  password,
  roles = [],
  permissions = [],
  dashboard = "user",
  isActive = true,
}) => {
  if (!name || !phone) {
    throw new Error("Name and phone are required");
  }

  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    throw new Error("Phone number already exists");
  }

  if (email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new Error("Email already exists");
    }
  }

  const passwordHash = password ? await hashPassword(password) : undefined;

  // 1️⃣ Create base user (NO roles here)
  const user = await User.create({
    name,
    email: email || undefined,
    phone,
    passwordHash,
    isActive,
  });

  // 2️⃣ Assign roles & permissions (RBAC + profile creation)
  if (roles.length || permissions.length || dashboard) {
    await assignRoleService({
      userId: user._id,
      roles,
      permissions,
      dashboard,
    });
  }

  // 3️⃣ Return fresh user with updated roles
  const updatedUser = await User.findById(user._id)
    .select("_id name email phone roles permissions dashboard isActive")
    .lean();

  return updatedUser;
};

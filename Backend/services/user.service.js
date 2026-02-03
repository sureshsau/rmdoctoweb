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

  // 1️⃣ Find existing user (phone is primary identity)
  let user = await User.findOne({ phone });

  const passwordHash = password ? await hashPassword(password) : undefined;

  if (user) {
    // 🔁 UPDATE FLOW

    // Email uniqueness check (only if changed)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (emailExists) {
        throw new Error("Email already exists");
      }
      user.email = email;
    }

    user.name = name;
    user.isActive = isActive;

    if (passwordHash) {
      user.passwordHash = passwordHash;
    }

    await user.save();
  } else {
    // 🆕 CREATE FLOW

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        throw new Error("Email already exists");
      }
    }

    user = await User.create({
      name,
      email: email || undefined,
      phone,
      passwordHash,
      isActive,
    });
  }

  // 2️⃣ Assign roles & permissions (idempotent inside service)
  if (roles.length || permissions.length || dashboard) {
    await assignRoleService({
      userId: user._id,
      roles,
      permissions,
      dashboard,
    });
  }

  // 3️⃣ Return fresh user
  const updatedUser = await User.findById(user._id)
    .select("_id name email phone roles permissions dashboard isActive profiles")
    .lean();

  return updatedUser;
};


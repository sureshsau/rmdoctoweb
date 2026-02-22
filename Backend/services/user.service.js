import User from "../models/user.model.js";
import { hashPassword } from "../utils/password.js";
import { assignRoleService } from "./roleAssignments.service.js";

export const createUserService = async ({
  name,
  phone,
  roles = [],
  permissions = [],
  dashboard = "user",
  isActive = true
}) => {

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!name) {
    throw new Error("Name is required");
  }

  // Normalize phone (important)
  const normalizedPhone = phone.trim();

  // 1️⃣ Find user by phone (primary identity)
  let user = await User.findOne({ phone: normalizedPhone });

  if (user) {
    /* ================= UPDATE FLOW ================= */

    user.name = name;
    user.isActive = isActive;

    await user.save();

  } else {
    /* ================= CREATE FLOW ================= */

    user = await User.create({
      name,
      phone: normalizedPhone,
      isActive,
      dashboard
    });
  }

  // 2️⃣ Assign roles & permissions (optional)
  if (roles.length || permissions.length || dashboard) {
    await assignRoleService({
      userId: user._id,
      roles,
      permissions,
      dashboard
    });
  }

  // 3️⃣ Return fresh user
  const updatedUser = await User.findById(user._id)
    .select("_id name phone roles permissions dashboard isActive profiles rmCoinsBalance")
    .lean();

  return updatedUser;
};



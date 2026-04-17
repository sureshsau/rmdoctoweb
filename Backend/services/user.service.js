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

export const addSavedAddressService = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.savedAddresses && user.savedAddresses.length >= 5) {
    throw new Error("Maximum of 5 saved addresses allowed. Please delete one first.");
  }

  user.savedAddresses.push(addressData);
  await user.save();
  return user.savedAddresses;
};

export const deleteSavedAddressService = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.savedAddresses = user.savedAddresses.filter(
    (addr) => addr._id.toString() !== addressId.toString()
  );
  await user.save();
  return user.savedAddresses;
};

import crypto from "crypto";
import User from "../models/user.model.js";
import { hashPassword } from "../utils/password.js";
import { assignRoleService } from "./roleAssignments.service.js";

/**
 * Sign-in credential for a staff account created by an admin.
 *
 * Login is password-based and self-registration rejects a phone that already
 * exists, so an admin-created account with no passwordHash could never sign in.
 * The account therefore gets a temporary password, returned to the admin once
 * so they can hand it over. 8 chars, digits only after the prefix — easy to
 * read out over a phone call.
 */
const generateTempPassword = () => `RM${crypto.randomInt(100000, 1000000)}`;

export const createUserService = async ({
  name,
  phone,
  roles = [],
  permissions = [],
  dashboard = "user",
  isActive = true,
  password
}) => {

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!name) {
    throw new Error("Name is required");
  }

  // assignRoleService refuses the admin role, but it only runs *after* the
  // account has been inserted — the admin saw "Create Failed" while a
  // role-less user was left behind in the collection. Reject it up front.
  if (roles.includes("admin")) {
    throw new Error(
      "The admin role cannot be assigned here. Pick a different role."
    );
  }

  // Normalize phone (important)
  const normalizedPhone = phone.trim();

  // Login and self-registration both key off a 10-digit number
  if (!/^\d{10}$/.test(normalizedPhone)) {
    throw new Error("Phone number must be exactly 10 digits");
  }

  // 1️⃣ Find user by phone (primary identity)
  let user = await User.findOne({ phone: normalizedPhone });

  let tempPassword = null;

  if (user) {
    /* ================= UPDATE FLOW ================= */
    // An existing account keeps its own password — never reset it silently

    user.name = name;
    user.isActive = isActive;

    await user.save();

  } else {
    /* ================= CREATE FLOW ================= */

    tempPassword = password || generateTempPassword();

    user = await User.create({
      name,
      phone: normalizedPhone,
      isActive,
      dashboard,
      passwordHash: await hashPassword(tempPassword)
    });
  }

  // 2️⃣ Assign roles & permissions (optional)
  // Anything that fails here (an unassignable role, a profile that won't
  // validate) must not leave a half-built account behind — but only the
  // account this call created is ours to remove.
  if (roles.length || permissions.length || dashboard) {
    try {
      await assignRoleService({
        userId: user._id,
        roles,
        permissions,
        dashboard
      });
    } catch (err) {
      if (tempPassword) {
        await User.deleteOne({ _id: user._id });
      }
      throw err;
    }
  }

  // 3️⃣ Return fresh user
  const updatedUser = await User.findById(user._id)
    .select("_id rmdId name phone roles permissions dashboard isActive kycStatus profiles rmCoinsBalance")
    .lean();

  // tempPassword is only ever set on the create path, and is the one moment it
  // can be shown — it is not recoverable afterwards
  return { ...updatedUser, isNew: Boolean(tempPassword), tempPassword };
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

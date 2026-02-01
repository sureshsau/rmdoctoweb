import User from "../models/user.model.js";

export const createUserService = async ({
  name,
  email,
  phone,
  passwordHash,
  roles = [],
  permissions = [],
  dashboard,
  isActive = false,
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

  const user = await User.create({
    name,
    email: email || undefined,
    phone,
    passwordHash,
    roles,
    permissions,
    dashboard,
    isActive,
  });

  return user;
};

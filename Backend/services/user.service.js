import USER from "../models/user.model.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";

export const createUserService = async ({ name, phone, email = null }) => {
  const existing = await USER.findOne({ phone });
  if (existing) {
    throw new AppError("User with this phone already exists", 409);
  }

  const plainPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await USER.create({
    name,
    phone,
    email,
    passwordHash,

    dashboard: "user",
    role: [],
    permissions: [],

    isActive: true,
    isBlocked: false,
    kycStatus: "none",
  });

  return {
    userId: user._id,
    phone: user.phone,
    email: user.email,
    credentials: {
      phone: user.phone,
      password: plainPassword, // send once only
    },
  };
};

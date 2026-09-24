import USER from "../models/user.model.js";

export const findByEmail = async (email) => {
  if (!email || typeof email !== "string") return null;
  return USER.findOne({ email: email.trim().toLowerCase() });
};

export const findByPhone = async (phone) => {
  if (!phone || typeof phone !== "string") return null;
  return USER.findOne({ phone: phone.trim() });
};

export const findByRmdId = async (rmdId) => {
  if (!rmdId || typeof rmdId !== "string") return null;
  return USER.findOne({ rmdId: rmdId.trim().toUpperCase() });
};

export const create = async (data) => {
  try {
    return await USER.create(data);
  } catch (err) {
    throw err;
  }
};


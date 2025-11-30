import PENDINGUSER from "../models/pendingUser.model.js";

export const create = (data) => PENDINGUSER.create(data);
export const findByEmail = (email) => PENDINGUSER.findOne({ email });
export const findByPhone = (phone) => PENDINGUSER.findOne({ phone });
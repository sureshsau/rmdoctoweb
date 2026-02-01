import USER from "../models/user.model.js";
import AppError from "../utils/AppError.js"
import {createUserService} from '../services/user.service.js'



export const getAllUserController = async (req, res) => {
  try {
    const users = await USER.find()
      .select("_id name email phone isActive isBlocked roles dashboard createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error in getAllUserController:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};





export const createUserController = async (req, res) => {
  try {
    const user = await createUserService(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        dashboard: user.dashboard,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

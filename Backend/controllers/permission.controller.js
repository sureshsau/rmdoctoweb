import { getAllPermissions } from "../services/permission.service.js";

export const getPermissionsController = async (req, res, next) => {
  try {
    const permissions = await getAllPermissions();
    res.status(200).json({
      success: true,
      count: permissions.length,
      permissions
    });
  } catch (error) {
    next(error);
  }
};

import jwt from "jsonwebtoken";
import USER from "../models/user.model.js";
import { ROLE_PERMISSIONS } from "../config/rolePermissions.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await USER.findById(decoded.id)
      .select(
        "_id dashboard roles permissions webSessionVersion appSessionVersion isBlocked isActive"
      )
      .lean();

    if (!user || user.isBlocked || !user.isActive) {
      return res.status(401).json({ success: false, message: "Your account is inactive or blocked" });
    }

    // Session validation
    if (decoded.deviceType === "web") {
      if (user.webSessionVersion !== decoded.version) {
        return res.status(401).json({ success: false, message: "Session expired" });
      }
    } else {
      if (user.appSessionVersion !== decoded.version) {
        return res.status(401).json({ success: false, message: "Session expired" });
      }
    }

    // Compute permissions from static configuration
    const userPermissions = new Set();
    if (user.roles) {
      for (const role of user.roles) {
        if (ROLE_PERMISSIONS[role]) {
          ROLE_PERMISSIONS[role].forEach(p => userPermissions.add(p));
        }
      }
    }

    // Attach user to request
    req.user = {
      id: user._id,
      dashboard: user.dashboard,
      roles: user.roles || [],
      permissions: Array.from(userPermissions),
      deviceType: decoded.deviceType,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(500).json({ message: "Authentication failed" });
  }
};


export function authorize(requiredPermissions) {
  // Allow no permissions = any authenticated user passes
  if (!requiredPermissions || (Array.isArray(requiredPermissions) && requiredPermissions.length === 0)) {
    return (req, res, next) => next();
  }

  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }

  return (req, res, next) => {
    const user = req.user;

    if (!user || !Array.isArray(user.permissions)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ── FULL-ACCESS ROLES ──────────────────────────────────────────
    // admin, subadmin, and employee get through all route guards
    const FULL_ACCESS_ROLES = ["admin", "subadmin", "employee"];
    if (user.roles?.some((r) => FULL_ACCESS_ROLES.includes(r))) {
      return next();
    }

    const granted = new Set(user.permissions);

    // Global super-admin wildcard override
    if (granted.has("*") || granted.has("*:*") || granted.has("*:*:*")) {
      return next();
    }

    const isAllowed = (neededPerm) => {
      const parts = neededPerm.split(".");

      for (const perm of granted) {
        // Exact match
        if (perm === neededPerm) return true;

        // Wildcard: e.g. "medicine.*" grants "medicine.create" etc.
        const permParts = perm.split(".");
        const allMatch = parts.every(
          (part, i) => permParts[i] === part || permParts[i] === "*"
        );
        if (allMatch && permParts.length === parts.length) return true;

        // Trailing wildcard: "medicine.*" matches "medicine.create"
        if (
          permParts[permParts.length - 1] === "*" &&
          permParts.slice(0, -1).join(".") === parts.slice(0, permParts.length - 1).join(".")
        ) {
          return true;
        }
      }

      return false;
    };

    const allowed = requiredPermissions.some(isAllowed);

    if (!allowed) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden – insufficient permissions" });
    }

    next();
  };
}


// ✅ CHECK IF USER IS ADMIN
export const isAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!Array.isArray(user.roles) || !user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this resource",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking admin status",
    });
  }
};

// ✅ CHECK IF USER IS OWNER OF THE RESOURCE OR ADMIN/SUBADMIN
export const isOwnerOrAdmin = (paramKey = "id") => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // We typically find the target ID from route params (like /user/:userId => req.params.userId)
      // or optionally from the request body.
      const targetId = req.params[paramKey] || req.body[paramKey];

      // Admin or subadmin bypass
      if (user.roles?.includes("admin") || user.roles?.includes("subadmin")) {
        return next();
      }

      // Ownership check
      if (targetId && user.id.toString() === targetId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only access your own data",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error verifying ownership",
      });
    }
  };
};

// ✅ ADMIN OR SUBADMIN ONLY — fast role check, no permission scan
export const isAdminOrSubadmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    if (user.roles?.includes("admin") || user.roles?.includes("subadmin")) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin or Subadmin access only",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error verifying admin role" });
  }
};

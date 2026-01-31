import jwt from "jsonwebtoken";
import USER from "../models/user.model.js";

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
      return res.status(401).json({success:false, message: "your Account is inactive or blocked" });
    }

    // Session validation
    if (decoded.deviceType === "web") {
      if (user.webSessionVersion !== decoded.version) {
        return res.status(401).json({success:false, message: "Session expired" });
      }
    } else {
      if (user.appSessionVersion !== decoded.version) {
        return res.status(401).json({success:false, message: "Session expired" });
      }
    }

    // Attach user (NO DB LOOKUPS ANYMORE)
    req.user = {
      id: user._id,
      dashboard: user.dashboard,
      roles: user.roles || [],
      permissions: user.permissions || [],
      deviceType: decoded.deviceType,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(500).json({ message: "Authentication failed" });
  }
};


export function authorize(requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }

  return (req, res, next) => {
    const user = req.user;

    console.log(user);

    if (!user || !Array.isArray(user.permissions)) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    //  ADMIN / SUBADMIN FULL ACCESS
    if (
      user.roles?.includes("admin") ||
      user.roles?.includes("subadmin")
    ) {
      return next();
    }

    const granted = new Set(user.permissions);

    // SUPER ADMIN / GLOBAL OVERRIDE VIA PERMISSIONS
    if (
      granted.has("*") ||
      granted.has("*:*") ||
      granted.has("*:*:*")
    ) {
      return next();
    }

    const isAllowed = (neededPerm) => {
      const [needRes, needAct, needScope] = neededPerm.split(":");

      for (const perm of granted) {
        const [res, act, scope] = perm.split(":");

        // Exact match
        if (perm === neededPerm) return true;

        // Wildcards
        if (
          (res === needRes || res === "*") &&
          (act === needAct || act === "*") &&
          (!needScope || scope === needScope || scope === "*")
        ) {
          return true;
        }

        // 3️⃣ Self-scope
        if (
          needScope === "self" &&
          res === needRes &&
          act === needAct &&
          scope === "self" &&
          req.params?.id === String(req.user.id)
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

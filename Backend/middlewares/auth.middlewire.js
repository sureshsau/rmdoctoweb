import jwt from 'jsonwebtoken'
import USER from "../models/user.model.js";
import { getRolesAndPermissionsById } from '../services/roleAssignments.service.js';

export const authenticate=async(req, res, next) =>{
  try {
    // -------------------------------
    // 1. GET TOKEN FROM HEADER
    // -------------------------------
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = parts[1];

    // -------------------------------
    // 2. VERIFY TOKEN
    // -------------------------------
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // decoded => { id, tokenVersion, deviceType, iat, exp }

    console.log(decoded);

    // 3. CHECK USER EXISTS
    // -------------------------------
    const user = await USER.findById(decoded.id).lean();

    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    // -------------------------------
    // 4. TOKEN VERSION CHECK 
    // - when user logs out from all devices
    // - forcefully invalidating previous tokens
    // -------------------------------
   
    if(decoded.deviceType=='web'){
      if (user.webSessionVersion !== decoded.version) {
      return res.status(401).json({ message: "Session expired. Login again." });
    }
    }else{
      if (user.appSessionVersion !== decoded.version) {
      return res.status(401).json({ message: "Session expired. Login again." });
    }
    }
    
    
    

    // -------------------------------
    // 5. ATTACH USER TO REQUEST
    // (without password)
    // -------------------------------
    const {roles,permissions}=await getRolesAndPermissionsById(user._id);
    req.user = {
      id: user._id,
      userType: user.userType,
      roles: roles || [],
      permissions:permissions || [],
      deviceType: decoded.deviceType  // mobile/web
    };

    next();

  } catch (err) {
    console.log("AUTH ERROR:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


export function authorize(requiredPermissions) {
  // Ensure array
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }

  return (req, res, next) => {
    const user = req.user;

    if (!user || !Array.isArray(user.permissions)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const granted = new Set(user.permissions);

    // SUPER ADMIN OVERRIDE
    if (granted.has("*") || granted.has("*:*") || granted.has("*:*:*")) {
      return next();
    }

    // ---------------------------------
    // INTERNAL MATCH FUNCTION
    // ---------------------------------
    const isAllowed = (neededPerm) => {
      const [needRes, needAct, needScope] = neededPerm.split(":");

      for (const perm of granted) {
        const [res, act, scope] = perm.split(":");

        // 1️⃣ Exact match
        if (perm === neededPerm) return true;

        // 2️⃣ resource:*:*  → full access to specific resource
        if (res === needRes && act === "*" && scope === "*") return true;

        // 3️⃣ resource:action:*  → action on any scope
        if (res === needRes && act === needAct && scope === "*") return true;

        // 4️⃣ resource:*:scope → any action on specific scope
        if (res === needRes && act === "*" && scope === needScope) return true;

        // 5️⃣ *:action:scope → wildcard resource
        if (res === "*" && act === needAct && scope === needScope) return true;

        // 6️⃣ *:*:scope → wildcard resource + action
        if (res === "*" && act === "*" && scope === needScope) return true;

        // 7️⃣ resource:action:* → wildcard scope
        if (res === needRes && act === needAct && scope === "*") return true;

        // 8️⃣ Self permissions
        if (
          needScope === "self" &&
          res === needRes &&
          act === needAct &&
          scope === "self"
        ) {
          // ALSO ensure user is acting on their own account
          if (req.params?.id && req.params.id === String(req.user.id)) {
            return true;
          }
          return false;
        }

        // 9️⃣ Global wildcard for both resource + action
        if (res === "*" && act === "*") return true;

        // 🔟 Single wildcard match (flexible rule)
        if ((res === needRes || res === "*") && (act === needAct || act === "*")) {
          return true;
        }
      }

      return false;
    };

    // OR logic → any permission must match
    const allowed = requiredPermissions.some(isAllowed);

    if (!allowed) {
      return res.status(403).json({ message: "Forbidden – insufficient permissions" });
    }

    next();
  };
}




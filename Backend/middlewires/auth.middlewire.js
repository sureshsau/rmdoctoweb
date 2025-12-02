import jwt from 'jsonwebtoken'
import USER from "../models/user.model.js";

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
    
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Session expired. Login again." });
    }

    // -------------------------------
    // 5. ATTACH USER TO REQUEST
    // (without password)
    // -------------------------------
    req.user = {
      id: user._id,
      companyId: user.companyId,
      userType: user.userType,
      roles: user.rolesCached || [],
      permissions: user.permissionsCached || [],
      deviceType: decoded.deviceType  // mobile/web
    };

    next();

  } catch (err) {
    console.log("AUTH ERROR:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

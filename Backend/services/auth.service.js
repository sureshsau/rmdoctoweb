import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis.config.js";

import * as UserRepo from "../repositories/user.repo.js";
import * as PendingRepo from "../repositories/pendingUser.repo.js";
import * as OtpService from "./otp.service.js";
import { sendOtpEmail } from "../queues/producers/email.producer.js";
import { newUserNotification } from "../queues/producers/notification.producer.js";


export const register = async (data) => {
  try {
    // Normalize
    console.log("Hit");
    const name = data.name?.trim();
    const phone = data.phone?.trim() || null;
    const email = data.email?.trim().toLowerCase() || null;
    const password = data.password;

    // =============================
    // Basic Validation
    // =============================
    if (!name || !phone || !password) {
      return { status: 400, body: { message: "Name, phone & password are required." } };
    }

    if (!/^\d{10}$/.test(phone)) {
      return { status: 400, body: { message: "Invalid phone number." } };
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return { status: 400, body: { message: "Invalid email format." } };
    }

    if (password.length < 8) {
      return {
        status: 400,
        body: { message: "Password must be at least 8 characters long." },
      };
    }

    // ✅ ALWAYS use phone as identifier
    const identifier = phone;
    const redisKey = `register:user:${phone}`;

    // =============================
    // Duplicate Check (DB)
    // =============================
    const [
      existingByEmail,
      existingByPhone,
      pendingByEmail,
      pendingByPhone,
    ] = await Promise.all([
      email ? UserRepo.findByEmail(email) : null,
      UserRepo.findByPhone(phone),
      email ? PendingRepo.findByEmail(email) : null,
      PendingRepo.findByPhone(phone),
    ]);

    if (existingByPhone) {
      return { status: 409, body: {success:false, message: "Phone already registered." } };
    }

    if (existingByEmail) {
      return { status: 409, body: {success:false, message: "Email already registered." } };
    }

    if (pendingByPhone) {
      return {
        status: 409,
        body: {success:false, message: "Registration already pending for this phone." },
      };
    }

    if (pendingByEmail) {
      return {
        status: 409,
        body: {success:false, message: "Registration already pending for this email." },
      };
    }

    // =============================
    // Generate OTP + Hash
    // =============================
    const hashPass = await bcrypt.hash(password, 10);
    const otp = OtpService.generateOtp();
    const hashedOtp = await bcrypt.hash(String(otp), 10);
    const now = Date.now();

    const existing = await redis.get(redisKey);

    // =============================
    // OTP RESEND FLOW
    // =============================
    if (existing) {
      let parsed = JSON.parse(existing);

      if (parsed.lastOtpTime && now - parsed.lastOtpTime < 60000) {
        const remaining = Math.ceil((60000 - (now - parsed.lastOtpTime)) / 1000);
        return {
          status: 429,
          body: { message: `Wait ${remaining}s to request another OTP.` },
        };
      }

      parsed.otp = hashedOtp;
      parsed.lastOtpTime = now;
      parsed.otpAttempts = (parsed.otpAttempts || 0) + 1;

      await redis.set(redisKey, JSON.stringify(parsed), "EX", 30);

      if (email) await sendOtpEmail(email, otp);
      // else: TODO send SMS to phone

      return { status: 200, body: { message: "OTP resent", identifier } };
    }

    // =============================
    // NEW OTP SESSION
    // =============================
    await redis.set(
      redisKey,
      JSON.stringify({
        name,
        email,
        phone,
        hashPass,
        otp: hashedOtp,
        otpAttempts: 1,
        lastOtpTime: now,
      }),
      "EX",
      300
    );

    if (email) await sendOtpEmail(email, otp);
    // else: TODO send SMS

    return {
      status: 200,
      body: {success:true, message: "OTP sent", phone, identifier }, // identifier = phone
    };

  } catch (error) {
    console.error("Register Error:", error);
    return {
      status: 500,
      body: {success:false, message: "Internal server error. Please try again." },
    };
  }
};


export const verifyOtp = async ({ identifier, otp, ip, device }) => {
  try {
    const redisKey = `register:user:${identifier}`;

    const data = await redis.get(redisKey);
    if (!data) {
      return {
        status: 410,
        body: { success: false, message: "Session expired or invalid" },
      };
    }

    const parsed = JSON.parse(data);

    // 🔐 Verify OTP
    const validOtp = await bcrypt.compare(String(otp), parsed.otp);
    if (!validOtp) {
      return {
        status: 401,
        body: { success: false, message: "Invalid OTP" },
      };
    }

    // 🔒 Duplicate checks
    const [existingEmail, existingPhone] = await Promise.all([
      parsed.email ? UserRepo.findByEmail(parsed.email) : null,
      UserRepo.findByPhone(parsed.phone),
    ]);

    if (existingPhone) {
      return {
        status: 409,
        body: { success: false, message: "Phone already registered" },
      };
    }

    if (existingEmail) {
      return {
        status: 409,
        body: { success: false, message: "Email already registered" },
      };
    }

    // 👤 Create basic user (NO ROLES, NO PERMISSIONS)
    const newUserData = {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email ? parsed.email.trim().toLowerCase() : undefined,
      passwordHash: parsed.hashPass,

      dashboard: "user",
      roles: [],
      permissions: [],

      isActive: true,
      isBlocked: false,

      firstLoginIP: ip,
      firstLoginDevice: device,
      lastLoginIP: ip,
      lastLoginDevice: device,
      lastLoginAt: new Date(),

      devices: [{ ip, device, loggedInAt: new Date() }],
    };

    const user = await UserRepo.create(newUserData);

    await newUserNotification({
      name: user.name,
      email: user.email,
      userId: user._id.toString(),
    });

    await redis.del(redisKey);

    // 📱 Device detection
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
        device
      );
    const deviceType = isMobile ? "app" : "web";

    // 🔁 Session versioning
    let version;
    if (deviceType === "web") {
      user.webSessionVersion += 1;
      version = user.webSessionVersion;
    } else {
      user.appSessionVersion += 1;
      version = user.appSessionVersion;
    }

    await user.save();

    // 🔐 JWT (KEEP IT SMALL)
    const token = jwt.sign(
      {
        id: user._id,
        deviceType,
        version,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 🧼 Response-safe user object
    const sanitizeUser = {
      id: user._id,
      name: user.name,
      identifier: user.email || user.phone,
      dashboard: user.dashboard,
      roles: user.role || [],
      permissions: user.permissions || [],
    };

    return {
      status: 201,
      body: {
        success: true,
        message: "OTP verified. Account created and sent for admin approval.",
        user: sanitizeUser,
        token,
      },
    };
  } catch (err) {
    console.error("verifyOtp error:", err);
    return {
      status: 500,
      body: { success: false, message: "Internal Server Error" },
    };
  }
};





export const login = async ({ email, phone, password, ip, device }) => {
  try {
    
    if ((!email && !phone) || !password) {
      return {
        status: 400,
        body: { success: false, message: "Email/Phone and password are required" },
      };
    }

    // 1️⃣ Find user
    let user;
    if (email) user = await UserRepo.findByEmail(email);
    else user = await UserRepo.findByPhone(phone);

    if (!user) {
      return {
        status: 404,
        body: { success: false, message: "User does not exist" },
      };
    }

    // 2️⃣ Optional safety checks
    if (user.isBlocked) {
      return {
        status: 403,
        body: { success: false, message: "Account is blocked" },
      };
    }

    if (!user.isActive) {
      return {
        status: 403,
        body: { success: false, message: "Account not active" },
      };
    }

    // 3️⃣ Validate password
    const isPasswordValid =await  bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        status: 401,
        body: { success: false, message: "Invalid password" },
      };
    }

    // 4️⃣ Detect device type
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
        device
      );
    const deviceType = isMobile ? "app" : "web";
    console.log(deviceType);

    // 5️⃣ Session versioning
    let version;
    if (deviceType === "web") {
      user.webSessionVersion += 1;
      version = user.webSessionVersion;
    } else {
      user.appSessionVersion += 1;
      version = user.appSessionVersion;
    }

    // 6️⃣ Update login metadata
    user.lastLoginIP = ip;
    user.lastLoginDevice = device;
    user.lastLoginAt = new Date();


    await user.save();

    // 7️⃣ Sanitize user for response
    const sanitizedUser = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email || null,
      dashboard: user.dashboard,
      roles: user.roles || [],
      permissions:user.permissions || [],
      profileImage: user.faceImage?.url || null,
      rmCoinsBalance: user.rmCoinsBalance || 0,
    };

    // 8️⃣ Generate JWT (keep it small)
    const token = jwt.sign(
      {
        id: user._id,
        deviceType,
        version,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Login successful",
        user: sanitizedUser,
        token,
      },
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      status: 500,
      body: { success: false, message: "Internal server error" },
    };
  }
};


// Resend Otp
export const resendOtp = async ({ identifier }) => {
  try {
    // console.log("yes it's hit");
    if (!identifier) {
      return { status: 400, body: { error: "Identifier is required." } };
    }

    const redisKey = `register:user:${identifier}`;
    const existing = await redis.get(redisKey);

    if (!existing) {
      return {
        status: 400,
        body: { error: "Session expired. Please restart registration." },
      };
    }

    const parsed = JSON.parse(existing);

    // ---------------------------
    // 1. Cooldown check (60 sec)
    // ---------------------------
    if (parsed.lastOtpTime && Date.now() - parsed.lastOtpTime < 60_000) {
      const remaining = Math.ceil((60000 - (Date.now() - parsed.lastOtpTime)) / 1000);

      return {
        status: 429,
        body: { error: `Please wait ${remaining}s before requesting again.` },
      };
    }

    // ---------------------------
    // 2. Generate new OTP
    // ---------------------------
    const otp = OtpService.generateOtp();
    const hashedOtp = await bcrypt.hash(String(otp), 10);

    await redis.set(
      redisKey,
      JSON.stringify({
        ...parsed,
        otp: hashedOtp,
        lastOtpTime: Date.now(), // ⬅️ Updated timestamp
      }),
      "EX",
      300
    );

    if (parsed.email) {
      await sendOtpEmail(parsed.email, otp);
    }
    // TODO: send SMS if no email

    return {
      status: 200,
      body: { message: "OTP resent successfully" },
    };
  } catch (err) {
    console.error(err);
    return { status: 500, body: { error: "Internal Server Error" } };
  }
};

// Forgot password part 
export const forgotPasswordSendOtp = async ({ identifier, type }) => {
  try {
    if (!identifier || !type) {
      return {
        status: 400,
        body: { error: "Identifier and type are required." }
      };
    }

    const redisKey = `forgot:user:${identifier}`;

    let user = null;

    if (type === "email") {
      user = await UserRepo.findByEmail(identifier);
    } 
    else if (type === "phone") {
      user = await UserRepo.findByPhone(identifier);
    }

    if (!user) {
      return { status: 404, body: { message: "User does not exist with given credentials." } };
    }

    const otp = OtpService.generateOtp();
    const hashedOtp = await bcrypt.hash(String(otp), 10);

    await redis.set(
      redisKey,
      JSON.stringify({
        otp: hashedOtp,
        lastOtpTime: Date.now(),
        type,
        identifier,
      }),
      "EX",
      300
    );

    if (type === "email") {
      await sendOtpEmail(identifier, otp);
    }
    // else send SMS to phone

    return {
      status: 200,
      body: { message: "OTP sent for password reset.", identifier, type }
    };

  } catch (err) {
    console.error("forgotPasswordSendOtp:", err);
    return { status: 500, body: { message: "Internal Server Error" } };
  }
};



export const forgotPasswordVerifyOtp = async ({ identifier, otp, type }) => {
  const redisKey = `forgot:user:${identifier}`;
  const data = await redis.get(redisKey);

  if (!data) {
    return { status: 400, body: { error: "OTP expired or session invalid." } };
  }

  const parsed = JSON.parse(data);

  if (parsed.type !== type) {
    return { status: 400, body: { error: "Invalid request type." } };
  }

  const validOtp = await bcrypt.compare(String(otp), parsed.otp);
  if (!validOtp) {
    return { status: 400, body: { error: "Invalid OTP" } };
  }

  return { status: 200, body: { message: "OTP verified." } };
};



export const resetPassword = async ({ identifier,type, newPassword }) => {
  try {
    // console.log("am i hiting");
    const redisKey = `forgot:user:${identifier}`;

    // Ensure user verified OTP first
    const session = await redis.get(redisKey);
    if (!session) {
      return {
        status: 400,
        body: { error: "OTP verification required before resetting password." }
      };
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        status: 400,
        body: { error: "Password must be at least 8 characters long." }
      };
    }

    let user;
    // if (email) user = await UserRepo.findByEmail(email);
    // else user = await UserRepo.findByPhone(phone);
    if(type === "email"){
      user = await UserRepo.findByEmail(identifier);
    }else{
      user = await UserRepo.findByPhone(phone);
    }

    if (!user) {
      console.log('this is issue');
      return { status: 404, body: { error: "User does not exist." } };
    }

    const hashPass = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashPass;

    // Invalidate previous sessions
    user.webSessionVersion += 1;
    user.appSessionVersion += 1;

    await user.save();

    // Delete OTP session
    await redis.del(redisKey);

    return {
      status: 200,
      body: { message: "Password reset successfully." }
    };

  } catch (err) {
    console.error("resetPassword:", err);
    return {
      status: 500,
      body: { message: "Internal Server Error" }
    };
  }
};
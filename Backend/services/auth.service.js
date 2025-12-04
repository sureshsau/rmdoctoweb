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
      return { status: 409, body: { message: "Phone already registered." } };
    }

    if (existingByEmail) {
      return { status: 409, body: { message: "Email already registered." } };
    }

    if (pendingByPhone) {
      return {
        status: 409,
        body: { message: "Registration already pending for this phone." },
      };
    }

    if (pendingByEmail) {
      return {
        status: 409,
        body: { message: "Registration already pending for this email." },
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
      body: { message: "OTP sent", phone, identifier }, // identifier = phone
    };

  } catch (error) {
    console.error("Register Error:", error);
    return {
      status: 500,
      body: { message: "Internal server error. Please try again." },
    };
  }
};


export const verifyOtp = async ({ identifier, otp, ip, device }) => {
  try {
    // identifier IS phone
    const redisKey = `register:user:${identifier}`;

    const data = await redis.get(redisKey);
    if (!data) {
      return { status: 410, body: { error: "Session expired or no data found" } };
    }

    const parsed = JSON.parse(data);

    // Compare OTP
    const validOtp = await bcrypt.compare(String(otp), parsed.otp);
    if (!validOtp) {
      return { status: 401, body: { error: "Invalid OTP" } };
    }

    // =============================
    // HARD duplicate check (safety)
    // =============================
    const [existingEmail, existingPhone] = await Promise.all([
      parsed.email ? UserRepo.findByEmail(parsed.email) : null,
      UserRepo.findByPhone(parsed.phone),
    ]);

    if (existingPhone) {
      return { status: 409, body: { error: "Phone already registered." } };
    }

    if (existingEmail) {
      return { status: 409, body: { error: "Email already registered." } };
    }

    // =============================
    // Create new user
    // =============================
    const newUserData = {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email ? parsed.email.trim().toLowerCase() : undefined,
      passwordHash: parsed.hashPass,

      firstLoginIP: ip,
      firstLoginDevice: device,
      lastLoginIP: ip,
      lastLoginDevice: device,
      lastLoginAt: new Date(),

      devices: [
        { ip, device, loggedInAt: new Date() }
      ],

      isActive: false,
      userType: "user",
    };

    const user = await UserRepo.create(newUserData);

    await newUserNotification({
      name: parsed.name,
      email: parsed.email,
      userId: user._id.toString(),
    });

    await redis.del(redisKey);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(device);
    const deviceType = isMobile ? "app" : "web";

    let version = user.webSessionVersion;
    if (deviceType === "web") {
      user.webSessionVersion += 1;
      version = user.webSessionVersion;
    } else {
      user.appSessionVersion += 1;
      version = user.appSessionVersion;
    }
    await user.save();

    const jwtToken = jwt.sign(
      { id: user._id, deviceType, version },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const sanitizeUser = {
      id: user._id,
      name: user.name,
      identifier: user.email || user.phone,
      role: user.userType,
    };

    return {
      status: 201,
      body: {
        message: "OTP verified. Account created and sent for admin approval.",
        user: sanitizeUser,
        token: jwtToken,
      },
    };
  } catch (err) {
    console.log("verifyOtp error:", err);
    return { status: 500, body: { error: "Internal Server Error" } };
  }
};




export const login = async ({ email, phone, password, ip, device }) => {
  try {
    if ((!email && !phone) || !password) {
      return {
        status: 400,
        body: { error: "Email/Phone and Password are required." }
      };
    }

    // Find user  await user.save()
    let user;
    if (email) user = await UserRepo.findByEmail(email);
    else user = await UserRepo.findByPhone(phone);

    if (!user) {
      return { status: 404, body: { error: "User does not exist." } };
    }

    // Check if user is blocked
    // if (user.isBlocked) {
    //   return {
    //     status: 403,
    //     body: { error: "Your account is blocked. Contact support." }
    //   };
    // }

    // Check if account is approved
    // if (!user.isActive) {
    //   return {
    //     status: 403,
    //     body: { error: "Your account is not approved yet." }
    //   };
    // }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { status: 401, body: { error: "Invalid password." } };
    }

    // Tracke device type 
     const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(device);
    const deviceType = isMobile ? "app" : "web";
    let version = user.webSessionVersion;
    if(deviceType === "web"){
      user.webSessionVersion += 1;
      version = user.webSessionVersion;
    }else{
      user.appSessionVersion += 1;
      version = user.appSessionVersion;
    }

    // Update login details
    user.lastLoginIP = ip;
    user.lastLoginDevice = device;
    user.lastLoginAt = new Date();

    // Push login history
    user.devices.push({
      ip,
      device,
      loggedInAt: new Date()
    });

    await user.save();


    const senitizeUser = {
      id: user._id,
      name: user.name,
      identifier: user.email || user.phone,
      role: user.userType,
    }
    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        deviceType,
        version
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      status: 200,
      body: {
        message: "Login successful",
        user:senitizeUser,
        token
      }
    };

  } catch (err) {
    console.error("Login error:", err);
    return { status: 500, body: { error: "Internal Server Error" } };
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
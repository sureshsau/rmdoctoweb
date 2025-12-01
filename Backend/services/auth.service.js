import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis.config.js";

import * as UserRepo from "../repositories/user.repo.js";
import * as PendingRepo from "../repositories/pendingUser.repo.js";
import * as OtpService from "./otp.service.js";
import { sendOtpEmail } from "../queues/producers/email.producer.js";
import { newUserNotification } from "../queues/producers/notification.producer.js";


export const register = async (data) => {
  const { name, email, phone, password } = data;
  if (!name || !phone|| !password) {
    return { status: 400, body: { error: "All fields are required" } };
  }


  if (password.length < 8) {
      return {
        status: 400,
        body: { error: "Password must be at least 8 characters long." },
      };
    }

  // Which identifier to use?
  const identifier = email || phone; 
  if (!identifier) {
      return {
        status: 400,
        body: { error: "Either email or phone is required as an identifier." },
      };
  }

  const redisKey = `register:user:${identifier}`;

  // Check duplicate user
    if (email) {
      const existingByEmail = await UserRepo.findByEmail(email);
      if (existingByEmail) {
        return { status: 400, body: { error: "Email already registered." } };
      }
    }

    const existingByPhone = await UserRepo.findByPhone(phone);
    if (existingByPhone) {
      return { status: 400, body: { error: "Phone number already registered." } };
    }

    // Existing pending user (waiting for approval)
    if (email) {
      const pendingByEmail = await PendingRepo.findByEmail(email);
      if (pendingByEmail) {
        return {
          status: 400,
          body: { error: "Registration already pending for this email." },
        };
      }
    }

    const pendingByPhone = await PendingRepo.findByPhone(phone);
    if (pendingByPhone) {
      return {
        status: 400,
        body: { error: "Registration already pending for this phone number." },
      };
    }


  const hashPass = await bcrypt.hash(password, 10);
    const otp = OtpService.generateOtp();            // e.g. 4–6 digit code
    const hashedOtp = await bcrypt.hash(String(otp), 10);
    const now = Date.now();

  const existing = await redis.get(redisKey);

  // =====================================================
  // OTP RESEND FLOW
  // =====================================================
  if (existing) {
    let parsed = JSON.parse(existing);

    // Cooldown
    if (parsed.lastOtpTime && now - parsed.lastOtpTime < 60000) {
      const remaining = Math.ceil((60000 - (now - parsed.lastOtpTime)) / 1000);
      return {
        status: 429,
        body: { error: `Please wait ${remaining} seconds to request another OTP.` },
      };
    }

    parsed.otp = hashedOtp;
    parsed.lastOtpTime = now;
    parsed.otpAttempts = (parsed.otpAttempts || 0) + 1;

    await redis.set(redisKey, JSON.stringify(parsed), "EX", 1800);

    // Send OTP
    if (email) await sendOtpEmail(email, otp);
    else if (phone) {
      // TODO: send OTP via SMS
    }

    return { status: 200, body: { message: "OTP resent", identifier } };
  }



  // =====================================================
  // NEW OTP SESSION
  // =====================================================
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
    1800
  );

  // Send OTP
  if (email) await sendOtpEmail(email, otp);
  else if (phone) {
    // TODO: send OTP via SMS
  }

  return { status: 200, body: { message: "OTP sent", identifier } };
};


export const verifyOtp = async ({ email, phone, otp, ip, device }) => {
 try {
    const identifier = email || phone;
    const redisKey = `register:user:${identifier}`;
    // Get redis session
    const data = await redis.get(redisKey);
    if (!data) {
      return { status: 400, body: { error: "Session expired or no data found" } };
    }

    let parsed = JSON.parse(data);

    // Compare OTP
    const validOtp = await bcrypt.compare(String(otp), parsed.otp);
    if (!validOtp) {
      return { status: 400, body: { error: "Invalid OTP" } };
    }

    // -------------------------------------------------------
    // ✨ CREATE NEW USER after OTP verification
    // -------------------------------------------------------
    const newUserData = {
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone,
      passwordHash: parsed.hashPass,

      // ⭐ OTP device = first login device
      firstLoginIP: ip,
      firstLoginDevice: device,

      // ⭐ Initial login details
      lastLoginIP: ip,
      lastLoginDevice: device,
      lastLoginAt: new Date(),

      // ⭐ Login history
      devices: [
        {
          ip,
          device,
          loggedInAt: new Date()
        }
      ],

      // ⭐ New user is not approved yet
      isActive: false,
      userType: "user"
    };

    // Save user
    const user = await UserRepo.create(newUserData);

    // -------------------------------------------------------
    // OPTIONAL: Notify admin for approval
    // -------------------------------------------------------

    await newUserNotification({
      name: parsed.name,
      email: parsed.email,
      userId: user._id.toString()
    });

    // Delete redis OTP session
    await redis.del(redisKey);

    // sending json webToken 
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(device);
    const deviceType = isMobile ? "app" : "web";
    let version = user.webSessionVersion;
    if (deviceType === "web"){
    user.webSessionVersion += 1;
    version = user.webSessionVersion
    }else{
      user.appSessionVersion += 1;
      version = user.appSessionVersion;
    };
    await user.save()
   const jwtToken = jwt.sign(
  { id: user._id, deviceType, version },
  process.env.JWT_SECRET,
  { expiresIn: "30d" }
);
    return {
      status: 200,
      body: { message: "OTP verified. Account created and sent for admin approval.", user:user, token: jwtToken}
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
        user,
        token
      }
    };

  } catch (err) {
    console.error("Login error:", err);
    return { status: 500, body: { error: "Internal Server Error" } };
  }
};





export const resendOtp = async ({ email, phone }) => {
  try {
    // Must have either email or phone
    if (!email && !phone) {
      return {
        status: 400,
        body: { error: "Email or phone is required." }
      };
    }

    const identifier = email || phone;
    const redisKey = `register:user:${identifier}`


    // Check session
    const existing = await redis.get(redisKey);
    if (!existing) {
      return {
        status: 400,
        body: { error: "Session expired. Please restart registration." }
      };
    }

    const parsed = JSON.parse(existing);

    // Generate new OTP
    const otp = Math.floor(Math.random() * 9000) + 1000; // 1000–9999
    const hashedOtp = await bcrypt.hash(String(otp), 10);

    // Save back to Redis (keep other fields)
    await redis.set(
      redisKey,
      JSON.stringify({
        ...parsed,
        otp: hashedOtp,
        lastOtpTime: Date.now()
      }),
      "EX",
      1800
    );

    // Send OTP
    if (email) await sendOtpEmail(email, otp);
    // if phone → SMS OTP here

    return {
      status: 200,
      body: { message: "OTP resent successfully" }  // DO NOT return OTP
    };

  } catch (err) {
    console.error(err);
    return { status: 500, body: { error: "Internal Server Error" } };
  }
};





// Forgot password part 
export const forgotPasswordSendOtp = async ({ email, phone }) => {
  try {
    if (!email && !phone) {
      return {
        status: 400,
        body: { error: "Email or Phone is required." }
      };
    }

    const identifier = email || phone;
    const redisKey = `forgot:user:${identifier}`;

    // Find user
    let user;
    if (email) user = await UserRepo.findByEmail(email);
    else user = await UserRepo.findByPhone(phone);

    if (!user) {
      return { status: 404, body: { message: "User does not exist." } };
    }

    const otp = OtpService.generateOtp();
    const hashedOtp = await bcrypt.hash(String(otp), 10);

    await redis.set(
      redisKey,
      JSON.stringify({
        otp: hashedOtp,
        lastOtpTime: Date.now(),
        otpAttempts: 1,
        identifier
      }),
      "EX",
      600 // 10 minutes expiry
    );

    // send OTP
    if (email) await sendOtpEmail(email, otp);
    // SMS if phone

    return {
      status: 200,
      body: { message: "OTP sent for password reset.", identifier }
    };

  } catch (err) {
    console.error("forgotPasswordSendOtp:", err);
    return {
      status: 500,
      body: { message: "Internal Server Error" }
    };
  }
};


export const forgotPasswordVerifyOtp = async ({ email, phone, otp }) => {
  try {
    const identifier = email || phone;
    const redisKey = `forgot:user:${identifier}`;

    const data = await redis.get(redisKey);
    if (!data) {
      return {
        status: 400,
        body: { error: "OTP expired or session invalid." }
      };
    }

    const parsed = JSON.parse(data);

    const validOtp = await bcrypt.compare(String(otp), parsed.otp);
    if (!validOtp) {
      return {
        status: 400,
        body: { error: "Invalid OTP" }
      };
    }

    // Allow reset password next
    return {
      status: 200,
      body: { message: "OTP verified. You may reset your password now." }
    };

  } catch (err) {
    console.error("forgotPasswordVerifyOtp:", err);
    return {
      status: 500,
      body: { message: "Internal Server Error" }
    };
  }
};


export const resetPassword = async ({ email, phone, newPassword }) => {
  try {
    const identifier = email || phone;
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
    if (email) user = await UserRepo.findByEmail(email);
    else user = await UserRepo.findByPhone(phone);

    if (!user) {
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

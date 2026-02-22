import bcrypt from "bcryptjs";
import redis from "../config/redis.config.js";
import { sendLoginOtpSms } from "../services/sms.service.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const sendOtpLogin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit phone required"
      });
    }

    const redisKey = `login:otp:${phone}`;
    const existing = await redis.get(redisKey);
    const now = Date.now();

    // ---------------------------
    // 🔁 RESEND LOGIC
    // ---------------------------
    if (existing) {
      const parsed = JSON.parse(existing);

      // ⏱ 30 SECOND COOLDOWN
      if (now - parsed.lastSentAt < 30_000) {
        const remaining = Math.ceil(
          (30_000 - (now - parsed.lastSentAt)) / 1000
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining}s before requesting again`
        });
      }

      // 🚫 MAX RESEND LIMIT (5)
      if (parsed.resendCount >= 5) {
        return res.status(429).json({
          success: false,
          message: "Maximum OTP attempts reached. Try later."
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);
      const hashedOtp = await bcrypt.hash(String(otp), 10);

      await redis.set(
        redisKey,
        JSON.stringify({
          otp: hashedOtp,
          resendCount: parsed.resendCount + 1,
          verifyAttempts: parsed.verifyAttempts || 0,
          lastSentAt: now
        }),
        "EX",
        600 // ✅ 10 minutes expiry
      );

      await sendLoginOtpSms({ mobile: phone, otp });

      return res.status(200).json({
        success: true,
        message: "OTP resent successfully"
      });
    }

    // ---------------------------
    // 🆕 FIRST TIME OTP
    // ---------------------------

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = await bcrypt.hash(String(otp), 10);

    await redis.set(
      redisKey,
      JSON.stringify({
        otp: hashedOtp,
        resendCount: 1,
        verifyAttempts: 0,
        lastSentAt: now
      }),
      "EX",
      600 // ✅ 10 minutes expiry
    );

    await sendLoginOtpSms({ mobile: phone, otp });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error("sendOtpLogin error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};





export const verifyOtpLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const ip = req.ip;
    const device = req.headers["user-agent"];

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required"
      });
    }

    const redisKey = `login:otp:${phone}`;
    const data = await redis.get(redisKey);

    if (!data) {
      return res.status(410).json({
        success: false,
        message: "OTP expired"
      });
    }

    const parsed = JSON.parse(data);

    //  Block after 5 failed attempts
    if (parsed.verifyAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Try again later."
      });
    }

    const validOtp = await bcrypt.compare(String(otp), parsed.otp);

    if (!validOtp) {
      parsed.verifyAttempts += 1;

      await redis.set(redisKey, JSON.stringify(parsed), "EX", 600);

      return res.status(401).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // ✅ Successful verification
    await redis.del(redisKey);

    // 🔥 Check if user exists
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name: "User",
        phone,
        isActive: true,
        isBlocked: false,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked"
      });
    }

    // 📱 Device detection
    const isMobile =
      /Android|iPhone|Mobile/i.test(device);
    const deviceType = isMobile ? "app" : "web";

    let version;
    if (deviceType === "web") {
      user.webSessionVersion += 1;
      version = user.webSessionVersion;
    } else {
      user.appSessionVersion += 1;
      version = user.appSessionVersion;
    }

    user.lastLoginIP = ip;
    user.lastLoginDevice = device;
    user.lastLoginAt = new Date();

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        deviceType,
        version
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" } 
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        dashboard: user.dashboard,
        roles: user.roles || [],
        permissions: user.permissions || [],
        profileImage: user.faceImage?.url || null,
        rmCoinsBalance: user.rmCoinsBalance || 0,
      }
    });

  } catch (err) {
    console.error("verifyOtpLogin error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



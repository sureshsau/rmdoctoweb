import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import USER from '../models/user.model.js';
import redis from '../utils/RediesClient.js';
import { generateUniqueUserId } from '../utils/generateUserId.js';
import queueService from '../queues/queueFactory.js';
import PENDINGUSER from '../models/pendingUser.model.js';
import NOTIFICATION_TYPES from '../constant/notificationType.js';
export const Register = async (req, res) => {
  try {
    let { name, email, phone, password, role, permissions } = req.body;

    if (!name || !email || !phone || !password || !role || !permissions) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const existingUser = await USER.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const existingPending = await redis.get(`register:${email}`);

    if (existingPending) {
      let parsed = JSON.parse(existingPending);
      const now = Date.now();

      // 1️⃣ COOL DOWN (60 sec limit)
      if (parsed.lastOtpTime && now - parsed.lastOtpTime < 60000) {
        const remaining = Math.ceil((60000 - (now - parsed.lastOtpTime)) / 1000);
        return res.status(429).json({
          error: `Please wait ${remaining} seconds to request another OTP.`,
        });
      }

      // 2️⃣ MAX OTP ATTEMPTS (5 attempts in 30 mins)
      if ((parsed.otpAttempts || 0) >= 5) {
        return res.status(429).json({
          error: "Too many OTP attempts. Try again after 30 minutes.",
        });
      }

      // 3️⃣ GENERATE & RESEND OTP
      const newOtp = Math.floor(1000 + Math.random() * 9000);

      parsed.otp = newOtp;
      parsed.lastOtpTime = now;
      parsed.otpAttempts = (parsed.otpAttempts || 0) + 1;

      await redis.set(
        `register:${email}`,
        JSON.stringify(parsed),
        "EX",
        1800
      );

      await queueService.publish(
        "emailQueue",
        { email, otp: newOtp },
        {
          attempts: 5,
          backoff: { type: "exponential", delay: 30000 },
          removeOnComplete: true,
        },
        "send-otp"
      );

      return res.status(200).json({
        success: true,
        message: "OTP resent to your email.",
        email,
      });
    }

    // ⭐ NEW REGISTRATION
    const hashPass = await bcrypt.hash(password, 10);
    const otp = Math.floor(1000 + Math.random() * 9000);

    await redis.set(
      `register:${email}`,
      JSON.stringify({
        name,
        email,
        phone,
        hashPass,
        role,
        permissions,
        otp,
        otpAttempts: 1,
        lastOtpTime: Date.now()
      }),
      "EX",
      1800
    );

    await queueService.publish(
      "emailQueue",
      { email, otp },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 30000 },
        removeOnComplete: true,
      },
      "send-otp"
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      email,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyOtp = async(req,res) =>{
    let {email, otp} = req.body;
    try{
        if(!email || !otp){
            res.status(400).json({error: 'Email and OTP are required'});
            return;
        }
        
      const data = await redis.get(`register:${email}`);

        if(!data){
            res.status(400).json({error: 'Session expired or no registration data found for this email'});
            return;
        }
        const parsed = JSON.parse(data);
        console.log(parsed)
    if (String(parsed.otp) !== String(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
        const userid =await generateUniqueUserId(); 
          const newUser = {
        name: parsed.name,
        userId: userid,
        email: parsed.email,
        phone: parsed.phone,
        password: parsed.hashPass,
        role:parsed.role,
        permissions: parsed.permissions,
    }
    // await newUser.save();
      const pendingUser= await PENDINGUSER({
        formData: newUser,
      })
     await pendingUser.save();

     queueService.publish(
  "notificationQueue",
  {
    templateCode: NOTIFICATION_TYPES.NEW_USER_REQUEST,
    payload: {
      name: parsed.name,
      email: parsed.email,
      pendingId: pendingUser._id.toString(),
    }
  },
  {
    attempts: 5,
    backoff: { type: "exponential", delay: 30000 },
    removeOnComplete: true,
  },
  NOTIFICATION_TYPES.NEW_USER_REQUEST   // job name
);

     await redis.del(`register:${email}`);
    res.status(200).json({message: 'Request forwarded successfully to admin'});
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

export const login = async(req,res)=>{
    let {email, password} = req.body;
    if(!email || !password){
      return res.status(400).json({error:"please enter your all credential"});
    }
    let user = await USER.findOne({email:email});
    if(!user){
        res.status(404).json({error: 'User does not exist'});
        return;
    }
    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
      return res.status(401).json({error: "Invalid password"});
    }
    const token = jwt.sign({userid: user.id},process.env.JWT_SECRET,{expiresIn:'7d'} );
    return res.status(200).json({
      token,
      user: user
    })     
}
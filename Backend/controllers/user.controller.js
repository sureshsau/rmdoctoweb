import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import USER from '../models/user.model.js';
import redis from '../utils/RediesClient.js';
import { generateUniqueUserId } from '../utils/generateUserId.js';
import { emailQueue } from '../queues/emailQueue.js';

export const Register = async (req, res) => {
  try {
    let { name, email, phone, password, role, permissions} = req.body;

    if (!name || !email || !phone || !password || !role || !permissions) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const existingUser = await USER.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashPass = await bcrypt.hash(password, 10);
    const otp = Math.floor(1000 + Math.random() * 9000);

    await redis.set(
      `register:${email}`,
      JSON.stringify({ name, email, phone, hashPass, role, permissions, otp }),
      "EX", 1800
    );
    
     await emailQueue.add(
    "send-otp",
    { email, otp },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 30000 },
      removeOnComplete: true,
    }
  );
    return res.status(200).json({
      success: true,
      message: "OTP is being sent to your email",
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
        
    if (String(parsed.otp) !== String(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
        const userid =await generateUniqueUserId(); 
          const newUser = new USER({
        name: parsed.name,
        userId: userid,
        email: parsed.email,
        phone: parsed.phone,
        password: parsed.hashPass,
        role:parsed.role,
        permissions: parsed.permissions,
    });


    await newUser.save();

    const token = jwt.sign({id: newUser.id}, process.env.JWT_SECRET, {
            expiresIn: '7d'
    });
     await redis.del(`register:${email}`);
    res.status(200).json({message: 'User created successfully', token: token,user: newUser});
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
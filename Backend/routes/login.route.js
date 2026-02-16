import express from "express";
import { sendOtpLogin, verifyOtpLogin } from "../controllers/login.controller.js";

const router = express.Router();

// 📲 Send OTP for login
router.post("/send-otp", sendOtpLogin);

// ✅ Verify OTP and login / create user
router.post("/verify-otp", verifyOtpLogin);

export default router;

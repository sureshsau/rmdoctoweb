import { Router } from "express";
import * as AuthController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";

// Import all validators
import {
  registerValidator,
  loginValidator,
  resendOtpValidator,
  verifyOtpValidator,
  forgotPasswordSendOtpValidator,
  forgotPasswordVerifyOtpValidator,
  resetPasswordValidator
} from "../validator/auth/index.js";

const router = Router();

// Register
router.post("/register", registerValidator, validate, AuthController.register);

// Verify OTP
router.post("/verifyotp", verifyOtpValidator, validate, AuthController.verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtpValidator, validate, AuthController.resendOtp);

// Login
router.post("/login", loginValidator, validate, AuthController.login);

// Forgot password: send OTP
router.post(
  "/forgot-password/send-otp",
  forgotPasswordSendOtpValidator,
  validate,
  AuthController.forgotPasswordSendOtp
);

// Forgot password: verify OTP
router.post(
  "/forgot-password/verify-otp",
  forgotPasswordVerifyOtpValidator,
  validate,
  AuthController.forgotPasswordVerifyOtp
);

// Reset password
router.post(
  "/forgot-password/reset",
  resetPasswordValidator,
  validate,
  AuthController.resetPassword
);

export default router;

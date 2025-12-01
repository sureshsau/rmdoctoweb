import { body } from "express-validator";

export const verifyOtpValidator = [
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone is required")
    .isMobilePhone().withMessage("Invalid phone number"),

  body("otp")
    .trim()
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 4, max: 6 }).withMessage("OTP must be 4–6 digits")
    .isNumeric().withMessage("OTP must be numeric"),
];
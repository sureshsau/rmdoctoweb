import { body } from "express-validator";

export const forgotPasswordVerifyOtpValidator = [
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP must be 4–6 digits"),

  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error("Email or phone is required.");
    }
    return true;
  })
];

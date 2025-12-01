import { body } from "express-validator";

export const resendOtpValidator = [
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone is required")
    .isMobilePhone().withMessage("Invalid phone number"),
];

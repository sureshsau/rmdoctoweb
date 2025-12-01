import { body } from "express-validator";

export const loginValidator = [
  // Email is optional
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email"),

  // Phone is mandatory
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .isMobilePhone().withMessage("Invalid phone number"),

  // Password required
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
];

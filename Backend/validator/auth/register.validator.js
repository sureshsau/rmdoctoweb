import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("phone").trim().isMobilePhone().withMessage("Valid phone required"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be 6+ chars"),
];
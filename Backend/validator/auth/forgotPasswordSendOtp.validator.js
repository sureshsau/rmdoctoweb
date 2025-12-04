import { body } from "express-validator";

export const forgotPasswordSendOtpValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Identifier (email or phone) is required.")
    .isString()
    .withMessage("Identifier must be a string"),

  body("type")
    .notEmpty()
    .withMessage("Type is required.")
    .isIn(["email", "phone"])
    .withMessage("Type must be 'email' or 'phone'"),

  // Conditional validation
  body("identifier").custom((value, { req }) => {
    if (req.body.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
      throw new Error("Invalid email format.");
    }
    if (req.body.type === "phone" && !/^\d{10}$/.test(value)) {
      throw new Error("Invalid phone number.");
    }
    return true;
  })
];

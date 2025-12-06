import { body } from "express-validator";

export const forgotPasswordVerifyOtpValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Identifier is required.")
    .isString()
    .withMessage("Identifier must be a string"),

  body("type")
    .notEmpty()
    .withMessage("Type is required.")
    .isIn(["email", "phone"])
    .withMessage("Type must be 'email' or 'phone'"),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required.")
    .isLength({ min: 4, max: 4 })
    .withMessage("OTP must be exactly 4 digits.")
    .isNumeric()
    .withMessage("OTP must contain digits only."),

  // Conditional identifier format checking
  body("identifier").custom((value, { req }) => {
    if (req.body.type === "email") {
      const validEmail = /^\S+@\S+\.\S+$/.test(value);
      if (!validEmail) throw new Error("Invalid email format.");
    }

    if (req.body.type === "phone") {
      const validPhone = /^\d{10}$/.test(value);
      if (!validPhone) throw new Error("Invalid phone number format.");
    }

    return true;
  })
];

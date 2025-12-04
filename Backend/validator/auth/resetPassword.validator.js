import { body } from "express-validator";

export const resetPasswordValidator = [
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

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),

  // Conditional validation of identifier
  body("identifier").custom((value, { req }) => {
    const { type } = req.body;

    if (type === "email") {
      const validEmail = /^\S+@\S+\.\S+$/.test(value);
      if (!validEmail) throw new Error("Invalid email format.");
    }

    if (type === "phone") {
      const validPhone = /^\d{10}$/.test(value);
      if (!validPhone) throw new Error("Invalid phone number format.");
    }

    return true;
  })
];

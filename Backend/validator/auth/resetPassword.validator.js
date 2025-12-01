import { body } from "express-validator";

export const resetPasswordValidator = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error("Email or phone is required.");
    }
    return true;
  })
];

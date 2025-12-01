import { body } from "express-validator";

export const forgotPasswordSendOtpValidator = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format"),

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error("Email or phone is required.");
    }
    return true;
  })
];

import { validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message, //  MAIN MESSAGE
      errors: formattedErrors,             //  DETAILED ERRORS
    });
  }

  next();
};

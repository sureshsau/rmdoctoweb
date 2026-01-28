import { body, validationResult } from "express-validator";

export const attendanceSettingsValidationRules = [
  body("shiftStartTime")
    .exists().withMessage("shiftStartTime is required")
    .isString().withMessage("shiftStartTime must be string"),

  body("shiftEndTime")
    .exists().withMessage("shiftEndTime is required")
    .isString().withMessage("shiftEndTime must be string"),

  body("requiredHoursPerDay")
    .optional()
    .isInt({ min: 1 })
    .withMessage("requiredHoursPerDay must be >= 1"),

  body("halfDayMinHours")
    .optional()
    .isInt({ min: 1 })
    .withMessage("halfDayMinHours must be >= 1"),

  body("graceMinutes")
    .optional()
    .isInt({ min: 0 })
    .withMessage("graceMinutes must be >= 0"),

  body("weeklyOffDays")
    .optional()
    .isArray()
    .withMessage("weeklyOffDays must be an array"),

  body("allowedLocation")
    .optional()
    .isObject()
    .withMessage("allowedLocation must be an object"),

  body("allowedLocation.lat")
    .if(body("allowedLocation").exists())
    .isFloat({ min: -90, max: 90 })
    .withMessage("allowedLocation.lat must be valid latitude"),

  body("allowedLocation.lng")
    .if(body("allowedLocation").exists())
    .isFloat({ min: -180, max: 180 })
    .withMessage("allowedLocation.lng must be valid longitude"),

  body("allowedLocation.radiusMeters")
    .optional()
    .isInt({ min: 1 })
    .withMessage("radiusMeters must be >= 1")
];

// 🔐 Validation result + cleanup
export const validateAttendanceSettings = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  next();
};

export const parseAttendancePayload = (req, res, next) => {
  try {
    // numbers
    if (req.body.requiredHoursPerDay)
      req.body.requiredHoursPerDay = Number(req.body.requiredHoursPerDay);

    if (req.body.halfDayMinHours)
      req.body.halfDayMinHours = Number(req.body.halfDayMinHours);

    if (req.body.graceMinutes)
      req.body.graceMinutes = Number(req.body.graceMinutes);

    // arrays
    if (req.body.weeklyOffDays && typeof req.body.weeklyOffDays === "string") {
      req.body.weeklyOffDays = JSON.parse(req.body.weeklyOffDays);
    }

    // objects
    if (req.body.allowedLocation && typeof req.body.allowedLocation === "string") {
      req.body.allowedLocation = JSON.parse(req.body.allowedLocation);
    }

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }
};

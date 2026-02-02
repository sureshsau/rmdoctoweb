import { body, validationResult } from "express-validator";
import { cleanupUploadedFile } from "../../utils/cleanupUploadedFile.js";

/* 🔐 VALIDATION RULES */
export const addMedicineValidationRules = [

  body("name")
    .exists().withMessage("name is required")
    .isString().withMessage("name must be string"),

  body("brandName")
    .optional()
    .isString().withMessage("brandName must be string"),

  body("description")
    .optional()
    .isString().withMessage("description must be string"),

  body("therapeuticUse")
    .optional()
    .isString().withMessage("therapeuticUse must be string"),

  body("dosageForm")
    .exists().withMessage("dosageForm is required")
    .isString().withMessage("dosageForm must be string"),

  body("prescriptionType")
    .optional()
    .isIn(["OTC", "RX"])
    .withMessage("prescriptionType must be OTC or RX"),

  body("pricing")
    .exists().withMessage("pricing is required")
    .isObject().withMessage("pricing must be object"),

  body("pricing.mrp")
    .exists().withMessage("pricing.mrp is required")
    .isFloat({ min: 0 })
    .withMessage("mrp must be >= 0"),

  body("pricing.price")
    .exists().withMessage("pricing.normalUserPrice is required")
    .isFloat({ min: 0 })
    .withMessage("normalUserPrice must be >= 0"),

  body("pricing.specialPrice")
    .exists().withMessage("pricing.marketingAgentPrice is required")
    .isFloat({ min: 0 })
    .withMessage("marketingAgentPrice must be >= 0"),

  body("gstPercentage")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("gstPercentage must be >= 0"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("tags must be an array"),

  body("composition")
    .optional()
    .isArray()
    .withMessage("composition must be an array"),

  body("composition.*.ingredient")
    .if(body("composition").exists())
    .isString()
    .withMessage("ingredient must be string"),

  body("composition.*.strength")
    .if(body("composition").exists())
    .isString()
    .withMessage("strength must be string"),

  body("stock")
    .optional()
    .isObject()
    .withMessage("stock must be an object"),

  body("stock.totalQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("totalQuantity must be >= 0"),

  body("stock.minAlertQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("minAlertQuantity must be >= 0"),

  body("batches")
    .optional()
    .isArray()
    .withMessage("batches must be an array"),

  body("batches.*.batchNumber")
    .optional()
    .isString()
    .withMessage("batchNumber must be string"),

  body("batches.*.expiryDate")
    .optional()
    .isISO8601()
    .withMessage("expiryDate must be valid date"),

  body("batches.*.quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("batch quantity must be >= 0"),

  body("manufacturer")
    .optional()
    .isObject()
    .withMessage("manufacturer must be an object")
];

/* 🔐 VALIDATION RESULT */
export const validateAddMedicine = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    cleanupUploadedFile(req);

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

/* 🔄 TYPE CASTING & PARSING */
export const parseAddMedicinePayload = (req, res, next) => {
  try {
    // numbers
    if (req.body.gstPercentage)
      req.body.gstPercentage = Number(req.body.gstPercentage);

    if (req.body.pricing && typeof req.body.pricing === "string")
      req.body.pricing = JSON.parse(req.body.pricing);

    if (req.body.stock && typeof req.body.stock === "string")
      req.body.stock = JSON.parse(req.body.stock);

    // arrays
    if (req.body.tags && typeof req.body.tags === "string")
      req.body.tags = JSON.parse(req.body.tags);

    if (req.body.composition && typeof req.body.composition === "string")
      req.body.composition = JSON.parse(req.body.composition);

    if (req.body.batches && typeof req.body.batches === "string")
      req.body.batches = JSON.parse(req.body.batches);

    // objects
    if (req.body.manufacturer && typeof req.body.manufacturer === "string")
      req.body.manufacturer = JSON.parse(req.body.manufacturer);

    next();
  } catch (err) {
    console.log(err);
    cleanupUploadedFile(req);

    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload"
    });
  }
};

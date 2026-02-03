import { body, validationResult } from "express-validator";

/* SINGLE MIDDLEWARE */
export const createMedicineOrderMiddleware = async (req, res, next) => {
  try {
    /* =======================
       🔄 PARSE & TYPE CAST
    ======================== */

    if (typeof req.body.items === "string")
      req.body.items = JSON.parse(req.body.items);

    if (typeof req.body.deliveryAddress === "string")
      req.body.deliveryAddress = JSON.parse(req.body.deliveryAddress);

    if (
      req.body.deliveryAddress?.location &&
      typeof req.body.deliveryAddress.location === "string"
    ) {
      req.body.deliveryAddress.location =
        JSON.parse(req.body.deliveryAddress.location);
    }

    if (req.body.allowSpecialPrice !== undefined)
      req.body.allowSpecialPrice =
        req.body.allowSpecialPrice === true ||
        req.body.allowSpecialPrice === "true";

    /* =======================
       🔐 VALIDATION RULES
    ======================== */

    await Promise.all([

      body("items")
        .exists().withMessage("items are required")
        .isArray({ min: 1 }).withMessage("items must be a non-empty array")
        .run(req),

      body("items.*.medicineId")
        .exists().withMessage("medicineId is required")
        .isMongoId().withMessage("medicineId must be valid")
        .run(req),

      body("items.*.quantity")
        .exists().withMessage("quantity is required")
        .isInt({ min: 1 }).withMessage("quantity must be >= 1")
        .run(req),

      body("deliveryAddress")
        .exists().withMessage("deliveryAddress is required")
        .isObject().withMessage("deliveryAddress must be object")
        .run(req),

      body("deliveryAddress.fullName")
        .exists().withMessage("fullName is required")
        .isString().withMessage("fullName must be string")
        .run(req),

      body("deliveryAddress.phone")
        .exists().withMessage("phone is required")
        .isString().withMessage("phone must be string")
        .isLength({ min: 10, max: 15 })
        .withMessage("phone must be valid")
        .run(req),

      body("deliveryAddress.addressLine1")
        .exists().withMessage("addressLine1 is required")
        .isString().withMessage("addressLine1 must be string")
        .run(req),

      body("deliveryAddress.city")
        .exists().withMessage("city is required")
        .isString().withMessage("city must be string")
        .run(req),

      body("deliveryAddress.state")
        .exists().withMessage("state is required")
        .isString().withMessage("state must be string")
        .run(req),

      body("deliveryAddress.pincode")
        .exists().withMessage("pincode is required")
        .isString().withMessage("pincode must be string")
        .run(req),

      body("deliveryAddress.location")
        .exists().withMessage("location is required")
        .isObject().withMessage("location must be object")
        .run(req),

      body("deliveryAddress.location.coordinates")
        .exists().withMessage("coordinates are required")
        .isArray({ min: 2, max: 2 })
        .withMessage("coordinates must be [lng, lat]")
        .run(req),

      body("deliveryAddress.location.coordinates.*")
        .isFloat().withMessage("coordinates must be numbers")
        .run(req),

      body("paymentMode")
        .exists().withMessage("paymentMode is required")
        .isIn(["COD", "ONLINE", "RM_CREDIT"])
        .withMessage("paymentMode must be COD, ONLINE or RM_CREDIT")
        .run(req),

      body("allowSpecialPrice")
        .optional()
        .isBoolean()
        .withMessage("allowSpecialPrice must be boolean")
        .run(req)

    ]);

    /* =======================
       ❌ HANDLE ERRORS
    ======================== */

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

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload"
    });
  }
};

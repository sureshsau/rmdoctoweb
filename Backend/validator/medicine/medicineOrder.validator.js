import { body, validationResult } from "express-validator";

export const createMedicineOrderMiddleware = async (req, res, next) => {
  try {
    console.log(req.body);
    /* =======================
       🔄 PARSE & TYPE CAST
    ======================== */
    
    if (typeof req.body.items === "string") {
      req.body.items = JSON.parse(req.body.items);
    }

    if (typeof req.body.deliveryAddress === "string") {
      req.body.deliveryAddress = JSON.parse(req.body.deliveryAddress);
    }

    if (
      req.body.deliveryAddress?.location &&
      typeof req.body.deliveryAddress.location === "string"
    ) {
      req.body.deliveryAddress.location = JSON.parse(
        req.body.deliveryAddress.location
      );
    }

    if (req.body.allowSpecialPrice !== undefined) {
      req.body.allowSpecialPrice =
        req.body.allowSpecialPrice === true ||
        req.body.allowSpecialPrice === "true";
    }

    /* =======================
       🔐 VALIDATION RULES
    ======================== */

    await Promise.all([
      body("items")
        .isArray({ min: 1 })
        .withMessage("items must be a non-empty array")
        .run(req),

      body("items.*.medicineId")
        .isMongoId()
        .withMessage("medicineId must be a valid Mongo ID")
        .run(req),

      body("items.*.quantity")
        .isInt({ min: 1 })
        .withMessage("quantity must be at least 1")
        .run(req),

      /* ---------- ADDRESS ---------- */

      body("deliveryAddress")
        .isObject()
        .withMessage("deliveryAddress must be an object")
        .run(req),

      body("deliveryAddress.fullName")
        .notEmpty()
        .withMessage("fullName is required")
        .isString()
        .withMessage("fullName must be string")
        .bail()
        .run(req),

      body("deliveryAddress.phone")
        .notEmpty()
        .withMessage("phone is required")
        .isString()
        .withMessage("phone must be string")
        .isLength({ min: 10, max: 15 })
        .withMessage("phone must be valid")
        .bail()
        .run(req),

      body("deliveryAddress.addressLine1")
        .notEmpty()
        .withMessage("addressLine1 is required")
        .isString()
        .withMessage("addressLine1 must be string")
        .bail()
        .run(req),

      body("deliveryAddress.pincode")
        .notEmpty()
        .withMessage("pincode is required")
        .isString()
        .withMessage("pincode must be string")
        .bail()
        .run(req),

      /* ---------- GEO LOCATION ---------- */

      body("deliveryAddress.location")
        .isObject()
        .withMessage("location must be object")
        .run(req),

      body("deliveryAddress.location.type")
        .optional()
        .isIn(["Point"])
        .withMessage("location.type must be Point")
        .run(req),

      body("deliveryAddress.location.coordinates")
        .isArray({ min: 2, max: 2 })
        .withMessage("coordinates must be [lng, lat]")
        .run(req),

      body("deliveryAddress.location.coordinates.0")
        .isFloat({ min: -180, max: 180 })
        .withMessage("longitude must be between -180 and 180")
        .run(req),

      body("deliveryAddress.location.coordinates.1")
        .isFloat({ min: -90, max: 90 })
        .withMessage("latitude must be between -90 and 90")
        .run(req),

      /* ---------- PAYMENT ---------- */

      body("paymentMode")
        .isIn(["COD", "ONLINE", "RM_CREDIT", "RM_COIN"])
        .withMessage("paymentMode must be COD, ONLINE, RM_CREDIT, or RM_COIN")
        .run(req),

      body("allowSpecialPrice")
        .optional()
        .isBoolean()
        .withMessage("allowSpecialPrice must be boolean")
        .run(req),
    ]);

    /* =======================
       ❌ HANDLE ERRORS
    ======================== */

    const errors = validationResult(req);
    console.log("Validation errors:", errors.array());
    
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }

    /* =======================
       ✅ NORMALIZE LOCATION
    ======================== */

    if (!req.body.deliveryAddress.location.type) {
      req.body.deliveryAddress.location.type = "Point";
    }

    next();
  } catch (err) {
    console.error("Error in createMedicineOrderMiddleware:", err);
    return res.status(400).json({
      success: false,
      message: "Invalid request payload",
    });
  }
};

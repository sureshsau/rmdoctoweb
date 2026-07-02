import mongoose from "mongoose";

const labOrderSchema = new mongoose.Schema(
  {
    // ── PEOPLE ────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Auto-resolved from agent profile (mirrors medicine order)
    marketingAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // Phlebotomist / RM Rider assigned to collect sample
    collectionAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // Lab where sample is processed
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
      index: true
    },

    // ── TESTS BOOKED ─────────────────────────────────────────────────
    items: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabTest",
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        unitPrice: {
          type: Number,
          required: true
        },
        gstPercentage: {
          type: Number,
          default: 0
        },
        gstAmount: {
          type: Number,
          required: true
        },
        totalPrice: {
          type: Number,
          required: true
        }
      }
    ],

    // ── PRICING ───────────────────────────────────────────────────────
    pricing: {
      subtotal: { type: Number, required: true },
      gstTotal: { type: Number, required: true },
      homeCollectionCharge: { type: Number, default: 0 },
      payableAmount: { type: Number, required: true }
    },

    // ── COLLECTION DETAILS ────────────────────────────────────────────
    collectionType: {
      type: String,
      enum: ["HOME", "WALK_IN"],
      default: "HOME",
      index: true
    },

    // Preferred date + time for sample collection
    scheduledAt: {
      type: Date
    },

    // Home collection address (same structure as medicine deliveryAddress)
    collectionAddress: {
      fullName:    { type: String },
      phone:       { type: String },
      addressLine1:{ type: String },
      addressLine2:{ type: String },
      pincode:     { type: String },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number] // [longitude, latitude]
        }
      }
    },

    // ── PAYMENT ───────────────────────────────────────────────────────
    paymentMode: {
      type: String,
      enum: ["COD", "ONLINE", "RM_CREDIT", "RM_COIN"],
      default: "COD",
      index: true
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      index: true
    },

    razorpay: {
      orderId:   String,
      paymentId: String,
      signature: String
    },

    // ── ORDER STATUS ──────────────────────────────────────────────────
    orderStatus: {
      type: String,
      enum: [
        "INITIATED",         // booking placed
        "CONFIRMED",         // payment received
        "SAMPLE_COLLECTED",  // phlebotomist collected sample (OTP verified)
        "REPORT_PENDING",    // sample in lab, report not yet ready
        "REPORT_READY",      // report uploaded & available
        "COMPLETED",         // user acknowledged
        "CANCELLED"
      ],
      default: "INITIATED",
      index: true
    },

    cancelledReason: {
      type: String
    },

    // ── OTP (for sample collection confirmation) ──────────────────────
    otp: { type: Number },
    otpVerified: { type: Boolean, default: false },

    // ── REPORT ────────────────────────────────────────────────────────
    reportUrl: { type: String, default: null },
    reportKey: { type: String, default: null }, // S3 key for deletion

    // ── PRESCRIPTION (optional upload) ────────────────────────────────
    prescription: {
      url:        { type: String, default: null },
      key:        { type: String, default: null },
      uploadedAt: { type: Date,   default: null }
    }
  },
  { timestamps: true }
);

labOrderSchema.index({ "collectionAddress.location": "2dsphere" });

const LabOrder = mongoose.model("LabOrder", labOrderSchema);

export default LabOrder;

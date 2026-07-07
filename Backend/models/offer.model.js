import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ["FLAT", "PERCENTAGE"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // Only applicable for PERCENTAGE
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number, // Maximum number of times this code can be used overall
      default: null,
    },
    usageLimitPerUser: {
      type: Number, // Maximum number of times a single user can use it
      default: 1,
    },
    applicableRoles: {
      type: [String],
      default: ["user", "receptionist", "rmrider", "employee"], // Excludes agents usually, but customizable
    },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);

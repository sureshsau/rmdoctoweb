import mongoose from "mongoose";

const RMCreditSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    totalCredit: {
      type: Number,
      default: 0,
      min: 0,
      set: v => Number(v) || 0
    },

    usedCredit: {
      type: Number,
      default: 0,
      min: 0,
      set: v => Number(v) || 0
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
      set: v => Number(v) || 0
    },

    expiryDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active"
    },

    revokeOtp: {
      type: String,
      default: null
    },

    revokeOtpExpiresAt: {
      type: Date,
      default: null
    },

    // 🔥 VERY IMPORTANT
    revokeAmount: {
      type: Number,
      default: null,
      set: v => (v === null ? null : Number(v))
    }
  },
  {
    timestamps: true
  }
);

const RMCredit = mongoose.model("RMCredit", RMCreditSchema);

export default RMCredit;

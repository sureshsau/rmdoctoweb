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

    // The agent reads this OTP off their own credits screen and relays it to
    // the admin, so it has to stay retrievable in plain form -- but a wrong
    // guess still needs to run out, and a resend shouldn't be spammable.
    revokeOtpAttempts: {
      type: Number,
      default: 0
    },

    revokeOtpSentAt: {
      type: Date,
      default: null
    },

    // 🔥 VERY IMPORTANT
    revokeAmount: {
      type: Number,
      default: null,
      set: v => (v === null ? null : Number(v))
    },

    // Locks the repayment amount server-side the moment the Razorpay order is
    // created, so verify never has to trust a client-supplied amount -- it
    // reads this instead, exactly like a LabOrder/MedicineOrder's own stored
    // pricing does for a regular checkout payment.
    pendingRepayment: {
      amount: { type: Number, default: null },
      razorpayOrderId: { type: String, default: null }
    }
  },
  {
    timestamps: true
  }
);

const RMCredit = mongoose.model("RMCredit", RMCreditSchema);

export default RMCredit;

import mongoose from "mongoose";

const RMCreditTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMCredit",
      required: true,
      index: true
    },

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    medicineOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineOrder",
      default: null
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // credit    = admin grants credit
    // debit     = agent spends credit on an order
    // revoke    = admin claws back unused balance (OTP-confirmed)
    // repayment = agent pays back used credit -- online (Razorpay) or offline (cash, admin-recorded)
    type: {
      type: String,
      enum: ["credit", "debit", "revoke", "repayment"],
      required: true,
      index: true
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Set only for an online repayment, so the payment can be traced back to
    // its Razorpay order/payment without joining another collection.
    razorpay: {
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null }
    },

    description: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

RMCreditTransactionSchema.index({ walletId: 1, createdAt: -1 });

const RMCreditTransaction = mongoose.model(
  "RMCreditTransaction",
  RMCreditTransactionSchema
);

export default RMCreditTransaction;

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

    // credit = admin add
    // debit = medicine purchase
    // revoke = admin remove
    type: {
      type: String,
      enum: ["credit", "debit", "revoke"],
      required: true,
      index: true
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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

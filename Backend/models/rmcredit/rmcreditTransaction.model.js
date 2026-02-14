import mongoose from "mongoose";

const RMCreditTransactionSchema = new mongoose.Schema(
  {
    // CREDIT REFERENCE
    rmCreditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMCredit",
      required: true,
      index: true
    },

    // AGENT REFERENCE (denormalized for faster queries)
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // MEDICINE ORDER REFERENCE (optional - only for debit/refund)
    medicineOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineOrder",
      default: null,
      index: true
    },

    // TRANSACTION DETAILS
    creditAmount: {
      type: Number,
      required: true,
      min: 0
    },

    remainingCredit: {
      type: Number,
      required: true,
      min: 0
    },

    // TRANSACTION TYPE
    type: {
      type: String,
      enum: ["send", "revoke", "debit", "refund"],
      default: "debit",
      index: true
    },

    // ADMIN WHO PERFORMED ACTION (for send/revoke)
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // DESCRIPTION/REASON
    description: {
      type: String,
      default: null
    },

    // STATUS
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
      index: true
    }
  },
  {
    timestamps: true
  }
);

// INDEXES
RMCreditTransactionSchema.index({ rmCreditId: 1, createdAt: -1 });
RMCreditTransactionSchema.index({ agentId: 1, type: 1 });
RMCreditTransactionSchema.index({ medicineOrderId: 1 });

const RMCreditTransaction = mongoose.model("RMCreditTransaction", RMCreditTransactionSchema);

export default RMCreditTransaction;

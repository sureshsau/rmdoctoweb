import mongoose from "mongoose";

const CreditLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "CREDIT",
        "BLOCK",
        "DEBIT",
        "UNBLOCK",
        "EXPIRE",
        "REVERSAL"
      ],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId // orderId / grantId
    },

    balanceSnapshot: {
      type: Number
    },

    meta: {
      type: Object
    }
  },
  { timestamps: true }
);

export default mongoose.model("CreditLedger", CreditLedgerSchema);

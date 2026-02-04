import mongoose from "mongoose";

const CreditWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    totalGranted: {
      type: Number,
      default: 0
    },

    totalUsed: {
      type: Number,
      default: 0
    },

    totalBlocked: {
      type: Number,
      default: 0
    },

    version: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("CreditWallet", CreditWalletSchema);

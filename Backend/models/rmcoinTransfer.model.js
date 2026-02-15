import mongoose from "mongoose";

const RMCoinsTransactionSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    type: {
      type: String,
      enum: ["transfer", "admin_transfer", "admin_recharge"],
      required: true
    },

    description: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("RMCoinsTransaction", RMCoinsTransactionSchema);

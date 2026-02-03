import mongoose from "mongoose";

const creditGrantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true
    },

    remainingAmount: {
      type: Number,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "USED", "EXPIRED"],
      default: "ACTIVE"
    },

    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reference: {
      type: String // dealId / admin note
    }
  },
  { timestamps: true }
);

export default mongoose.model("CreditGrant", creditGrantSchema);

import mongoose from "mongoose";

const targetOfferSchema = new mongoose.Schema(
  {
    rank: {
      type: Number, // e.g., 1 for 1st target, 2 for 2nd target
      required: true,
    },
    targetSalesAmount: {
      type: Number,
      required: true,
    },
    rewardDescription: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    targetMonth: {
      type: String, // format YYYY-MM
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TargetOffer", targetOfferSchema);

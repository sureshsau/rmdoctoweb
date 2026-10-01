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
    targetPeriodType: {
      type: String,
      enum: ["MONTHLY", "YEARLY", "CUSTOM"],
      default: "MONTHLY"
    },
    targetMonth: {
      type: String, 
      default: ""
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    audienceType: {
      type: String,
      enum: ["ALL_MAIN_CPS", "SPECIFIC_CP", "ALL_SUB_CPS", "SUB_CPS_OF"],
      default: "ALL_MAIN_CPS"
    },
    audienceRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Stores the User ID of the Community Partner
      default: null
    },
    bannerImage: {
      url: { type: String, default: null },
      key: { type: String, default: null },
      bucket: { type: String, default: null }
    },
  },
  { timestamps: true }
);

export default mongoose.model("TargetOffer", targetOfferSchema);

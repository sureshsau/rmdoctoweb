import mongoose from "mongoose";

const ReceptionistProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true
    },
    shift: {
      type: String,
      enum: ["morning", "evening", "night", "general"],
      default: "general"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // 🪪 KYC
    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    kycDocuments: [{
      url: { type: String },
      documentType: { type: String }
    }],
  },
  { timestamps: true }
);

export default mongoose.model("ReceptionistProfile", ReceptionistProfileSchema);

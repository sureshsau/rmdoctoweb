import mongoose from "mongoose";

const RiderProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    vehicleType: {
      type: String,
      default: "bike"
    },
    vehicleNumber: {
      type: String,
      default: ""
    },
    drivingLicense: {
      type: String,
      default: ""
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

export default mongoose.model("RiderProfile", RiderProfileSchema);

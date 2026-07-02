import mongoose from "mongoose";

const labSchema = new mongoose.Schema(
  {
    // BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    brandName: {
      type: String,
      trim: true,
      index: true
    },

    description: {
      type: String
    },

    // CONTACT
    phone: {
      type: String,
      required: true
    },

    email: {
      type: String
    },

    // ADDRESS
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city:  { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }
    },

    // GEO (for rider assignment / geosearch)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },

    // LEGAL
    licenseNumber: {
      type: String
    },

    // MEDIA
    images: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true }
      }
    ],

    // STATUS
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

labSchema.index({ location: "2dsphere" });

labSchema.index({
  name: "text",
  brandName: "text",
  "address.city": "text"
});

export default mongoose.model("Lab", labSchema);

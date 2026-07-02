import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    // BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    shortCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },

    description: {
      type: String
    },

    // CATEGORISATION
    category: {
      type: String,
      index: true
      // e.g. "Haematology", "Biochemistry", "Microbiology", "Radiology"
    },

    tags: {
      type: [String],
      index: true
    },

    // SAMPLE
    sampleType: {
      type: String,
      enum: ["Blood", "Urine", "Stool", "Saliva", "Swab", "Tissue", "Other"],
      required: true,
      index: true
    },

    // REPORT TURNAROUND TIME (hours)
    reportTat: {
      type: Number,
      default: 24
    },

    // LAB REFERENCE
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
      index: true
    },

    // ── DUAL PRICING (mirrors medicine.pricing) ──────────────────────
    pricing: {
      mrp: {
        type: Number,
        required: true
      },
      // What end-users / patients pay
      userPrice: {
        type: Number,
        required: true
      },
      // Discounted price for agents (like medicine.pricing.specialPrice)
      agentPrice: {
        type: Number,
        required: true
      }
    },

    gstPercentage: {
      type: Number,
      default: 0
    },

    // HOME COLLECTION
    homeCollectionAvailable: {
      type: Boolean,
      default: false
    },

    // PATIENT PREPARATION
    preparationRequired: {
      type: String
      // e.g. "Fasting 8 hours", "No preparation needed"
    },

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

/* 🔥 TEXT SEARCH INDEX */
labTestSchema.index({
  name: "text",
  shortCode: "text",
  category: "text",
  tags: "text"
});

export default mongoose.model("LabTest", labTestSchema);

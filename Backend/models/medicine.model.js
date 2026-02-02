import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
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

    // SEARCH & DISCOVERY
    tags: {
      type: [String],
      index: true
    },

    therapeuticUse: {
      type: String,
      index: true
    },

    // COMPOSITION
    composition: [
      {
        ingredient: {
          type: String,
          required: true
        },
        strength: {
          type: String,
          required: true
        }
      }
    ],

    // DOSAGE & LEGAL
    dosageForm: {
      type: String,
      enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Cream",
        "Drops",
        "Inhaler",
        "Other"
      ],
      required: true,
      index: true
    },

    prescriptionType: {
      type: String,
      enum: ["OTC", "RX"],
      default: "RX",
      index: true
    },

    // PRICING (DUAL PRICE SYSTEM)
    pricing: {
      mrp: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      specialPrice: {
        type: Number,
        required: true
      }
    },

    gstPercentage: {
      type: Number,
      default: 0
    },

    // STOCK
    stock: {
      totalQuantity: {
        type: Number,
        default: 0
      },
      minAlertQuantity: {
        type: Number,
        default: 10
      }
    },

    // BATCH & EXPIRY (CRITICAL FOR MEDICINES)
    batches: [
      {
        batchNumber: {
          type: String
        },
        expiryDate: {
          type: Date
        },
        quantity: {
          type: Number
        }
      }
    ],

    // MANUFACTURER INFO
    manufacturer: {
      name: {
        type: String
      },
      licenseNumber: {
        type: String
      },
      address: {
        type: String
      }
    },

    // MEDIA
    images: [
  {
    url: {
      type: String,
      required: true
    },
    key: {
      type: String,
      required: true
    }
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
        required: true,
        index: true
    }
    
  },
  {
    timestamps: true
  }
);

/* 🔥 TEXT SEARCH INDEX */
medicineSchema.index({
  name: "text",
  brandName: "text",
  therapeuticUse: "text",
  "composition.ingredient": "text",
  tags: "text"
});

export default mongoose.model("Medicine", medicineSchema);

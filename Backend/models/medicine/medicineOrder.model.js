import mongoose from "mongoose";

const medicineOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    deliveryAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default:null,
        index: true
    },
    marketingAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default:null,
        index: true
    },

    items: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          required: true
        },

        quantity: {
          type: Number,
          required: true
        },

        unitPrice: {
          type: Number,
          required: true
        },

        gstPercentage: {
          type: Number,
          default: 0
        },

        gstAmount: {
          type: Number,
          required: true
        },

        totalPrice: {
          type: Number,
          required: true
        }
      }
    ],

    pricing: {
      subtotal: {
        type: Number,
        required: true
      },

      gstTotal: {
        type: Number,
        required: true
      },

      deliveryCharge: {
        type: Number,
        default: 0
      },

      payableAmount: {
        type: Number,
        required: true
      }
    },

    deliveryAddress: {
      fullName: {
        type: String,
        required: true
      },

      phone: {
        type: String,
        required: true
      },

      addressLine1: {
        type: String,
        required: true
      },

      addressLine2: String,

      pincode: {
        type: String,
        required: true
      },

      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      }
    },

    paymentMode: {
      type: String,
      enum: ["COD", "ONLINE", "RM_CREDIT", "RM_COIN"],
      default:"COD",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      index: true
    },

    orderStatus: {
      type: String,
      enum: [
        "INITIATED",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
      ],
      default: "INITIATED",
      index: true
    },

    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String
    },

    otpVerified: {
      type: Boolean,
      default: false
    },
    otp:{
      type:Number,
      
    },

    cancelledReason: String
  },
  { timestamps: true }
);

medicineOrderSchema.index({ "deliveryAddress.location": "2dsphere" });

const MedicineOrder = mongoose.model("MedicineOrder", medicineOrderSchema);

export default MedicineOrder;

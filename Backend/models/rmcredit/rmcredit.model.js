import mongoose from "mongoose";

const RMCreditSchema = new mongoose.Schema(
  {
    // AGENT REFERENCE
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // CREDIT DETAILS
    totalCredit: {
      type: Number,
      required: true,
      min: 0
    },

    usedCredit: {
      type: Number,
      default: 0,
      min: 0
    },

    availableCredit: {
      type: Number,
      required: true,
      min: 0
    },

    // ADMIN WHO ASSIGNED CREDIT
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // STATUS
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true
    },

    // VALIDITY
    issueDate: {
      type: Date,
      default: Date.now
    },

    expiryDate: {
      type: Date,
      required: true
    },

    // NOTES FROM ADMIN
    notes: {
      type: String,
      default: null
    },

    // CANCELLATION TRACKING
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    cancellationReason: {
      type: String,
      default: null
    },

    cancellationDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// VIRTUAL: Calculate remaining credit
RMCreditSchema.virtual("remainingCredit").get(function () {
  return this.totalCredit - this.usedCredit;
});

// INDEXES
RMCreditSchema.index({ agentId: 1, status: 1 });
RMCreditSchema.index({ expiryDate: 1 });
RMCreditSchema.index({ assignedBy: 1 });

// PRE-SAVE HOOK: Update available credit
RMCreditSchema.pre("save", function (next) {
  this.availableCredit = this.totalCredit - this.usedCredit;
  next();
});

const RMCredit = mongoose.model("RMCredit", RMCreditSchema);

export default RMCredit;

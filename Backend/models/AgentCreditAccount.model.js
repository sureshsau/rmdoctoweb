import mongoose from "mongoose";

const agentCreditAccountSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentProfile",
      required: true,
      unique: true
    },

    totalCreditGranted: {
      type: Number,
      default: 0
    },

    totalCreditUsed: {
      type: Number,
      default: 0
    },

    availableCredit: {
      type: Number,
      default: 0
    },

    creditBlocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "AgentCreditAccount",
  agentCreditAccountSchema
);

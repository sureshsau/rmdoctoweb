import mongoose, { Schema } from "mongoose";

const pendingUserSchema = new Schema({
  formData: Object,
  status: {
    type: String,
    enum: ["pending", "Rejected", "Accepted"],
    default: "pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  viewed: { type: Boolean, default: false },
});

const PENDINGUSER = mongoose.model("PendingUser", pendingUserSchema);

export default PENDINGUSER;

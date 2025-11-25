import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    templateCode: { type: String, required: true },          // Which template generated this notification

    title: { type: String, required: true },                 // Final rendered title
    message: { type: String, required: true },               // Final rendered message

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    payload: { type: Object, default: {} },                  // Data used in placeholders

    actions: { type: Array, default: [] },                   // Copied from template

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info"
    },

    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);

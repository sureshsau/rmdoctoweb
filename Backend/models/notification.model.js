import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    templateCode: { type: String, default: "ADMIN_BROADCAST" },  // Which template generated this notification

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

    // Where the notification came from. "admin" = pushed manually from the
    // admin panel, "system" = raised by a template-driven backend event.
    source: {
      type: String,
      enum: ["admin", "system"],
      default: "system"
    },

    // Set when this notification is one copy of an admin broadcast, so the
    // admin history screen can group every recipient copy back together.
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationBroadcast",
      default: null
    },

    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// The inbox query is always "this user's notifications, newest first", and the
// bell badge is the unread slice of it.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);

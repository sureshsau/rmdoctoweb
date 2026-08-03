import mongoose from "mongoose";

/**
 * One document per "push" the admin sends. The individual per-user copies live
 * in the Notification collection and point back here via `broadcastId`; this
 * record is what the admin's sent-history screen reads.
 */
const notificationBroadcastSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info"
    },

    audience: {
      type: String,
      enum: ["ALL", "ROLES", "USERS"],
      required: true
    },

    // Only meaningful when audience === "ROLES"
    roles: { type: [String], default: [] },

    // Only meaningful when audience === "USERS"
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    recipientCount: { type: Number, default: 0 },

    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

notificationBroadcastSchema.index({ createdAt: -1 });

export const NotificationBroadcast = mongoose.model(
  "NotificationBroadcast",
  notificationBroadcastSchema
);

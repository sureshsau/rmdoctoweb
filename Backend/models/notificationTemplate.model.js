import mongoose from "mongoose";

const actionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },          // Button text (Approve / Reject / View)
    type: { type: String },                           // Optional internal type identifier
    apiEndpoint: { type: String },                    // API endpoint to call when clicked
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE"], default: "POST" },
    requiresPayload: { type: Boolean, default: true } // Whether the payload should be passed in API call
  },
  { _id: false }
);

const notificationTemplateSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },  // e.g. "NEW_USER_REQUEST"

    title: { type: String, required: true },               // e.g. "New Registration Request"

    message: { type: String, required: true },             // e.g. "{{name}} wants to join."

    category: { type: String, default: "general" },        // "USER", "PATIENT", "ATTENDANCE"

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info"
    },

    sendToRoles: [String],                                  // e.g. ["admin", "manager"]

    placeholders: [String],                                 // e.g. ["name", "email", "pendingId"]

    actions: [actionSchema]                                 // Dynamic action buttons
  },
  { timestamps: true }
);

export const NotificationTemplate = mongoose.model(
  "NotificationTemplate",
  notificationTemplateSchema
);

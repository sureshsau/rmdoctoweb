import mongoose from "mongoose";

/* One row per meet attempt against an RM Member's shop.
   The "pending / completed" split is *derived* from these rows for whatever
   period the caller asks about (day, week, month or a custom range) rather
   than stored per period — that way one model answers every filter and a
   custom range needs no backfill. */
const agentVisitSchema = new mongoose.Schema(
  {
    agentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentProfile",
      required: true,
      index: true
    },

    agentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* Who did the meet — a marketing executive or an admin */
    visitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    visitedByRole: {
      type: String,
      enum: ["ADMIN", "SUBADMIN", "MARKETING_AGENT", "EMPLOYEE"],
      default: "MARKETING_AGENT"
    },

    /* The marketing executive this RM Member belonged to at meet time.
       Kept denormalised so an admin can filter the plan by executive even
       after a member is re-assigned. */
    marketingAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    visitedAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    /* COMPLETED   → met, counts towards the period's completed list
       INCOMPLETE  → tried but did not meet; the member stays in Pending */
    status: {
      type: String,
      enum: ["COMPLETED", "INCOMPLETE"],
      default: "COMPLETED",
      index: true
    },

    outcome: {
      type: String,
      enum: [
        "MET",
        "ORDER_PLACED",
        "SHOP_CLOSED",
        "OWNER_UNAVAILABLE",
        "REFUSED",
        "WRONG_LOCATION",
        "OTHER"
      ],
      default: "MET"
    },

    /* Which cadence bucket the executive was working through when they
       ticked this off — purely for reporting. */
    visitType: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"],
      default: "CUSTOM"
    },

    /* 📍 Where the executive actually stood when marking it */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined
      }
    },

    address: { type: String, default: null },

    /* Metres between the executive and the registered shop location.
       null when either side has no coordinates. */
    distanceInMeters: { type: Number, default: null },

    notes: { type: String, default: null, trim: true },

    /* Optional on-the-spot proof photo taken during the meet */
    photo: {
      url: { type: String, default: null },
      key: { type: String, default: null },
      bucket: { type: String, default: null }
    }
  },
  { timestamps: true }
);

// The plan screen always slices by member + when, so index them together
agentVisitSchema.index({ agentProfileId: 1, visitedAt: -1 });
agentVisitSchema.index({ visitedBy: 1, visitedAt: -1 });
agentVisitSchema.index({ location: "2dsphere" });

export default mongoose.model("AgentVisit", agentVisitSchema);

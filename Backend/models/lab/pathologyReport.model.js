import mongoose from "mongoose";

/**
 * The report, and the two-stage workflow the lab asked for:
 *
 *   typist enters values ──> SUBMIT ──> lab technician reviews / edits ──> SEND
 *
 * A typist can only ever reach `submitted`. Only a technician can move a
 * report to `verified` and then `sent`; that gate is enforced both by route
 * permissions and again in the controller. Every transition is appended to
 * `audit`, so an edited value is always traceable to the person who changed it.
 *
 * This produces structured results in-house. The existing LabOrder.reportUrl
 * (an uploaded PDF) remains for reports that arrive from partner labs.
 */

const ResultValueSchema = new mongoose.Schema(
  {
    parameterName: { type: String, required: true },
    parameterCode: { type: String, default: null },
    unit: { type: String, default: "" },
    group: { type: String, default: null },
    order: { type: Number, default: 0 },
    valueType: {
      type: String,
      enum: ["numeric", "text", "options", "formula"],
      default: "numeric",
    },
    // Carried from the panel so the entry grid can render dropdowns and
    // recompute derived rows without re-reading the catalogue.
    options: { type: [String], default: [] },
    formula: { type: String, default: null },
    decimals: { type: Number, default: 1 },

    value: { type: mongoose.Schema.Types.Mixed, default: null },

    // Resolved for this patient's age/sex at intake and frozen onto the
    // report, so later catalogue edits never rewrite an issued result.
    refLow: { type: Number, default: null },
    refHigh: { type: Number, default: null },
    refDisplay: { type: String, default: null },

    flag: {
      type: String,
      enum: ["normal", "high", "low", "critical_high", "critical_low", "abnormal", ""],
      default: "",
    },

    editedByTechnician: { type: Boolean, default: false },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const ReportPanelSchema = new mongoose.Schema(
  {
    panel: { type: mongoose.Schema.Types.ObjectId, ref: "PathologyPanel" },
    code: { type: String, required: true },
    name: { type: String, required: true },
    // Frozen from the catalogue so the printed report can band panels under
    // their discipline heading ("Haematology", "Biochemistry") without a
    // second lookup, and without a later re-categorisation rewriting an
    // already-issued report.
    category: { type: String, default: "" },
    method: { type: String, default: "" },
    sampleType: { type: String, default: "" },
    interpretation: { type: String, default: "" },
    isInHouse: { type: Boolean, default: true },
    results: { type: [ResultValueSchema], default: [] },
  },
  { _id: false }
);

const AuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["created", "saved_draft", "submitted", "edited", "verified", "sent", "rejected"],
      required: true,
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    byName: { type: String, default: "" },
    byRmdId: { type: String, default: "" },
    role: { type: String, default: "" },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PathologyReportSchema = new mongoose.Schema(
  {
    reportNo: { type: String, required: true, unique: true, index: true },
    accession: { type: mongoose.Schema.Types.ObjectId, ref: "Accession", required: true, index: true },
    accessionNo: { type: String, required: true, index: true },

    panels: { type: [ReportPanelSchema], default: [] },

    status: {
      type: String,
      enum: ["draft", "submitted", "verified", "sent", "rejected"],
      default: "draft",
      index: true,
    },

    typist: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedAt: { type: Date, default: null },

    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },

    sentAt: { type: Date, default: null },
    sentChannels: { type: [String], default: [] },

    // Reason the technician bounced it back to the typist.
    rejectionReason: { type: String, default: "" },

    remarks: { type: String, default: "" },
    audit: { type: [AuditSchema], default: [] },
  },
  { timestamps: true }
);

PathologyReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("PathologyReport", PathologyReportSchema);

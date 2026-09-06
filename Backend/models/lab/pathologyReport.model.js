import mongoose from "mongoose";
export const REPORT_STATUSES = [
  "draft",
  "pending_technician",
  "technician_review",
  "lab_verified",
  "pending_doctor",
  "doctor_review",
  "final_verified",
  "released",
  "rejected",
  "returned",
];

// The only status a patient/user is ever allowed to see.
export const PATIENT_VISIBLE_STATUS = "released";

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
const ReferralSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["not_applicable", "awaiting_report", "uploaded", "verified"],
      default: "not_applicable",
    },
    labName: { type: String, default: null },
    reportUrl: { type: String, default: null },
    reportKey: { type: String, default: null }, // S3 key, for deletion on re-upload
    uploadedAt: { type: Date, default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Staff confirmation that the name/age/etc. on the partner lab's report
    // matches this patient -- the point of the verification step.
    patientNameMatched: { type: Boolean, default: false },
    notes: { type: String, default: "" },
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
    // Only meaningful when isInHouse is false -- see ReferralSchema above.
    referral: { type: ReferralSchema, default: () => ({}) },
  },
  { _id: false }
);

const AuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "saved_draft",
        "edited",
        // legacy 2-stage actions, kept so old audit rows still validate
        "submitted",
        "verified",
        "sent",
        // 3-stage workflow
        "sent_to_technician",
        "lab_verified",
        "sent_to_doctor",
        "doctor_remarks",
        "final_verified",
        "released",
        "rejected",
        "returned_by_doctor",
        // referred-out panel
        "referral_uploaded",
        "referral_verified",
      ],
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
      enum: REPORT_STATUSES,
      default: "draft",
      index: true,
    },

    // Stage 1 -- data entry operator (the `typist` role).
    typist: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedAt: { type: Date, default: null },

    // Stage 2 -- lab technician.
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    sentToDoctorAt: { type: Date, default: null },

    // Stage 3 -- doctor / pathologist.
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    finalVerifiedAt: { type: Date, default: null },
    doctorRemarks: { type: String, default: "" },

    // Release to the patient.
    sentAt: { type: Date, default: null },
    sentChannels: { type: [String], default: [] },

    // Reason the technician bounced it back to the data entry operator.
    rejectionReason: { type: String, default: "" },
    // Reason the doctor bounced it back to the technician.
    returnReason: { type: String, default: "" },

    remarks: { type: String, default: "" },
    audit: { type: [AuditSchema], default: [] },
  },
  { timestamps: true }
);

PathologyReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("PathologyReport", PathologyReportSchema);

import mongoose from "mongoose";

/**
 * Analyte definitions for in-house reporting.
 *
 * Deliberately separate from the existing `LabTest` model: that one is the
 * commercial, per-lab catalogue (labId, MRP / user / agent pricing, home
 * collection) describing what a given lab SELLS. This one is a lab-agnostic
 * template describing what a test MEASURES -- parameters, units, reference
 * ranges and derived formulas -- so the ranges are defined once rather than
 * duplicated for every lab that offers the panel.
 *
 * `labTests` optionally links a panel to the bookable LabTest entries it
 * produces results for, so a booking can find its reporting template.
 */

const ParameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    unit: { type: String, default: "", trim: true },

    // "numeric"  -> validated number, auto High/Low flagging
    // "text"     -> free text (e.g. "Nil", "Pale yellow")
    // "options"  -> constrained dropdown
    // "formula"  -> computed from sibling parameters, read-only in the grid
    valueType: {
      type: String,
      enum: ["numeric", "text", "options", "formula"],
      default: "numeric",
    },
    options: { type: [String], default: [] },

    // Evaluated against sibling parameter codes, e.g. "(hb / pcv) * 100".
    formula: { type: String, default: null },

    decimals: { type: Number, default: 1 },

    // Matched most-specific-first: sex + age window, then sex, then catch-all.
    // null low/high means unbounded on that side.
    ranges: [
      {
        sex: { type: String, enum: ["male", "female", "any"], default: "any" },
        minAgeYears: { type: Number, default: null },
        maxAgeYears: { type: Number, default: null },
        low: { type: Number, default: null },
        high: { type: Number, default: null },
        // Printed verbatim when set; otherwise derived from low/high.
        display: { type: String, default: null },
      },
    ],

    // Sub-heading rendered above this row (e.g. "DIFFERENTIAL COUNT").
    group: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const PathologyPanelSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },

    category: { type: String, required: true, trim: true, index: true },

    sampleType: { type: String, default: "Whole Blood", trim: true },
    container: { type: String, default: "EDTA", trim: true },
    method: { type: String, default: "", trim: true },

    // Optional bridge to the commercial catalogue.
    labTests: [{ type: mongoose.Schema.Types.ObjectId, ref: "LabTest" }],

    /**
     * The in-house / referral switch. CBC is run here; LFT is sent to a
     * partner lab. When false the specimen is flagged for dispatch and the
     * panel is excluded from the in-house report.
     */
    isInHouse: { type: Boolean, default: true, index: true },
    referralLab: {
      name: { type: String, default: null },
      contact: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
      licenseNumber: { type: String, default: null },
    },

    tatHours: { type: Number, default: 24 },

    parameters: { type: [ParameterSchema], default: [] },

    // Free-text footer printed under this panel (method notes, disclaimers).
    interpretation: { type: String, default: "" },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

PathologyPanelSchema.index({ name: "text", code: "text", category: "text" });

export default mongoose.model("PathologyPanel", PathologyPanelSchema);

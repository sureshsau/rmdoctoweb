import mongoose from "mongoose";

/**
 * A specimen intake -- created the moment a sample physically arrives.
 *
 * Distinct from the existing `LabOrder`, which is a customer BOOKING (cart,
 * pricing, payment, rider collection, OTP). One booking can yield a sample,
 * and `labOrder` links the two; walk-in patients have no booking at all, so
 * patient details are always denormalised here.
 *
 * `accessionNo` is the value encoded in the Code128 barcode; the patient
 * details beside it are printed human-readable on the same label.
 */

const AccessionPanelSchema = new mongoose.Schema(
  {
    panel: { type: mongoose.Schema.Types.ObjectId, ref: "PathologyPanel", required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },

    // Snapshot at intake time, so later catalogue edits never rewrite history.
    isInHouse: { type: Boolean, default: true },
    referralLab: {
      name: { type: String, default: null },
      contact: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
      licenseNumber: { type: String, default: null },
    },
    referralStatus: {
      type: String,
      enum: ["not_applicable", "pending_dispatch", "dispatched", "received"],
      default: "not_applicable",
    },
    dispatchedAt: { type: Date, default: null },
    resultReceivedAt: { type: Date, default: null },
  },
  { _id: false }
);

const VialSchema = new mongoose.Schema(
  {
    containerType: { type: String, trim: true },
    color: { type: String, trim: true },
    count: { type: Number, default: 1 },
    panelCodes: { type: [String], default: [] },
  },
  { _id: false }
);

// One printable label's worth of work: the tests and tubes for a single test
// category. The lab prints one label per category.
const CategoryGroupSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true },
    panelCodes: { type: [String], default: [] },
    vials: { type: [VialSchema], default: [] },
  },
  { _id: false }
);

const AccessionSchema = new mongoose.Schema(
  {
    accessionNo: { type: String, required: true, unique: true, index: true },

    // Set when the specimen came from a booked LabOrder.
    labOrder: { type: mongoose.Schema.Types.ObjectId, ref: "LabOrder", default: null, index: true },

    patientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    patient: {
      rmdId: { type: String, default: null, index: true },
      name: { type: String, required: true, trim: true },
      age: { type: Number, default: null },
      ageUnit: { type: String, enum: ["years", "months", "days"], default: "years" },
      sex: { type: String, enum: ["male", "female", "other"], default: "male" },
      phone: { type: String, default: null, index: true },
      address: { type: String, default: null },
    },

    referringDoctor: { type: String, default: "SELF", trim: true },

    panels: { type: [AccessionPanelSchema], default: [] },

    // Null until the matching real-world event happens. A pre-collection
    // accession (label printed for a booked order, rider not yet dispatched)
    // has neither set; a walk-in intake sets both at creation.
    collectedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },

    // Sample-collection logistics -- populated when the barcode label is
    // printed for a booked LabOrder, before the specimen physically exists.
    // (Not named `collection`: that is a reserved Mongoose schema path.)
    collectionInfo: {
      // Tube checklist the rider draws into. One entry per distinct container.
      vials: { type: [VialSchema], default: [] },
      // The same work split by test category — one printed label per group.
      categoryGroups: { type: [CategoryGroupSchema], default: [] },
      labelPrintedAt: { type: Date, default: null },
      labelPrintedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      // Booked LabTests that no in-house panel could be matched to.
      unmatchedTests: { type: [String], default: [] },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    status: {
      type: String,
      // Pre-collection path:
      //   awaiting_collection -> collected -> registered -> in_progress -> reported
      // Walk-in path starts at `registered`.
      enum: [
        "awaiting_collection",
        "collected",
        "registered",
        "in_progress",
        "reported",
        "cancelled",
      ],
      default: "registered",
      index: true,
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

AccessionSchema.index({ createdAt: -1 });

export default mongoose.model("Accession", AccessionSchema);

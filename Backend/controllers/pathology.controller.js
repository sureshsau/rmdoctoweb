import mongoose from "mongoose";
import PathologyPanel from "../models/lab/pathologyPanel.model.js";
import Accession from "../models/lab/accession.model.js";
import PathologyReport from "../models/lab/pathologyReport.model.js";
import LabOrder from "../models/lab/labOrder.model.js";
import User from "../models/user.model.js";
import { generateAccessionNo, generateUserRmdId } from "../utils/rmdId.js";
import {
  buildReportPanels,
  recalcReportPanels,
  computeVials,
  pendingReferrals,
  uploadReferralReportToS3,
  deleteReferralReportFromS3,
} from "../services/pathology.service.js";
import { cleanupUploadedFile } from "../utils/cleanupUploadedFile.js";

const ok = (res, data, message = "OK") =>
  res.status(200).json({ success: true, message, ...data });

const fail = (res, code, message) =>
  res.status(code).json({ success: false, message });

const isAdmin = (u) =>
  u?.roles?.includes("admin") ||
  u?.roles?.includes("subadmin") ||
  u?.roles?.includes("employee");

const isTechnician = (u) =>
  u?.dashboard === "lab_technician" || u?.roles?.includes("lab_technician") || isAdmin(u);

const isDoctor = (u) =>
  u?.dashboard === "doctor" || u?.roles?.includes("doctor") || isAdmin(u);

// The data entry operator. A technician can also enter values directly, which
// the lab explicitly asked for.
const isTypist = (u) =>
  u?.dashboard === "typist" || u?.roles?.includes("typist") || isTechnician(u);

// Statuses in which each actor may still edit result values. The doctor never
// edits values -- only remarks -- so is absent here.
const OPERATOR_EDIT = new Set(["draft", "rejected"]);
const TECHNICIAN_EDIT = new Set([
  "draft",
  "pending_technician",
  "technician_review",
  "lab_verified",
  "returned",
]);

async function actor(userId) {
  const u = await User.findById(userId).select("name rmdId dashboard").lean();
  return {
    by: userId,
    byName: u?.name || "",
    byRmdId: u?.rmdId || "",
    role: u?.dashboard || "",
  };
}

/* ========================= CATALOGUE ========================= */

export const listPanels = async (req, res) => {
  try {
    const { category, q, includeInactive } = req.query;
    const filter = {};
    if (!includeInactive) filter.isActive = true;
    if (category && category !== "all") filter.category = category;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }

    const panels = await PathologyPanel.find(filter).sort({ category: 1, name: 1 }).lean();
    const categories = await PathologyPanel.distinct("category", { isActive: true });

    return ok(res, { panels, categories });
  } catch (err) {
    console.error("listPanels error:", err);
    return fail(res, 500, "Failed to load catalogue");
  }
};

export const getPanel = async (req, res) => {
  try {
    const panel = await PathologyPanel.findById(req.params.id).lean();
    if (!panel) return fail(res, 404, "Panel not found");
    return ok(res, { panel });
  } catch (err) {
    console.error("getPanel error:", err);
    return fail(res, 500, "Failed to load panel");
  }
};

/** Formula token / result-entry key: must be a bare identifier. */
const CODE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const slugifyCode = (s) =>
  String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "_$1");

/**
 * Normalise and validate the parameter list before it is persisted, so a
 * mis-filled form can never store a nameless parameter or a code that a
 * formula / the entry grid cannot key on. Returns { params } or { error }.
 */
function normalizeParameters(input) {
  const rows = Array.isArray(input) ? input : [];
  const out = [];
  const seen = new Set();

  for (let i = 0; i < rows.length; i += 1) {
    const p = rows[i] || {};
    const name = String(p.name || "").trim();

    // A fully blank row is dropped; a row with data but no name is an error.
    const hasData =
      name ||
      String(p.code || "").trim() ||
      String(p.unit || "").trim() ||
      String(p.group || "").trim() ||
      String(p.formula || "").trim() ||
      (Array.isArray(p.options) && p.options.length) ||
      (Array.isArray(p.ranges) && p.ranges.length);
    if (!hasData) continue;
    if (!name) return { error: `Parameter #${i + 1} has no name` };

    const code = (String(p.code || "").trim() || slugifyCode(name)).toUpperCase();
    if (!CODE_RE.test(code)) {
      return { error: `Parameter "${name}" has an invalid code "${code}"` };
    }
    if (seen.has(code)) return { error: `Duplicate parameter code "${code}"` };
    seen.add(code);

    const valueType = ["numeric", "text", "options", "formula"].includes(p.valueType)
      ? p.valueType
      : "numeric";
    const keepRanges = valueType === "numeric" || valueType === "formula";

    out.push({
      name,
      code,
      unit: String(p.unit || "").trim(),
      valueType,
      decimals: Number.isFinite(Number(p.decimals)) ? Number(p.decimals) : 1,
      group: String(p.group || "").trim() || null,
      order: i + 1,
      options: valueType === "options" ? (p.options || []).filter(Boolean) : [],
      formula: valueType === "formula" ? String(p.formula || "").trim() || null : null,
      ranges: keepRanges
        ? (Array.isArray(p.ranges) ? p.ranges : []).map((r) => ({
            sex: ["male", "female", "any"].includes(r?.sex) ? r.sex : "any",
            minAgeYears: r?.minAgeYears ?? null,
            maxAgeYears: r?.maxAgeYears ?? null,
            low: r?.low ?? null,
            high: r?.high ?? null,
            display: r?.display ?? null,
          }))
        : [],
    });
  }
  return { params: out };
}

export const upsertPanel = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    if (!payload.code || !payload.name || !payload.category) {
      return fail(res, 400, "code, name and category are required");
    }

    if (payload.parameters !== undefined) {
      const { params, error } = normalizeParameters(payload.parameters);
      if (error) return fail(res, 400, error);
      if (params.length === 0) return fail(res, 400, "Add at least one parameter");
      payload.parameters = params;
    }

    const panel = id
      ? await PathologyPanel.findByIdAndUpdate(id, payload, {
          returnDocument: "after",
          runValidators: true,
        })
      : await PathologyPanel.create(payload);

    if (!panel) return fail(res, 404, "Panel not found");
    return ok(res, { panel }, id ? "Panel updated" : "Panel created");
  } catch (err) {
    if (err?.code === 11000) return fail(res, 409, "A panel with that code already exists");
    console.error("upsertPanel error:", err);
    return fail(res, 500, "Failed to save panel");
  }
};

/* ========================= ACCESSION ========================= */

/** Freeze a catalogue panel into the accession's per-panel snapshot. */
const toAccessionPanel = (p) => ({
  panel: p._id,
  code: p.code,
  name: p.name,
  category: p.category || "",
  isInHouse: p.isInHouse,
  referralLab: p.isInHouse ? { name: null, contact: null } : p.referralLab,
  referralStatus: p.isInHouse ? "not_applicable" : "pending_dispatch",
});

/**
 * Split a set of panels by test category — one printed collection label per
 * group, each with its own tube checklist. Categories are the panels' own
 * `category` (from the catalogue); a panel with none lands in "Uncategorised".
 */
const groupPanelsByCategory = (panelDocs = []) => {
  const byCategory = new Map();
  for (const p of panelDocs) {
    const category = String(p.category || "").trim() || "Uncategorised";
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(p);
  }
  return [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, docs]) => ({
      category,
      panelCodes: docs.map((d) => d.code),
      vials: computeVials(docs),
    }));
};

/**
 * Fuzzy-match booked LabTests to in-house pathology panels: exact
 * shortCode == panel code, else panel name containing the test name. Mirrors
 * the matcher the Register screen ran client-side. Returns the deduped panel
 * docs and the names of any tests nothing matched.
 */
async function matchPanelsForLabTests(items = []) {
  const panels = await PathologyPanel.find({ isActive: true }).lean();
  const matched = new Map();
  const unmatchedTests = [];

  for (const item of items) {
    const name = String(item?.testId?.name || "").trim().toLowerCase();
    const code = String(item?.testId?.shortCode || "").trim().toLowerCase();
    if (!name && !code) continue;

    const hit = panels.find(
      (p) =>
        (code && p.code.toLowerCase() === code) ||
        (name && p.name.toLowerCase().includes(name))
    );
    if (hit) matched.set(String(hit._id), hit);
    else unmatchedTests.push(item?.testId?.name || code || "Unknown test");
  }

  return { panels: [...matched.values()], unmatchedTests };
}

/**
 * Create the draft report for an accession -- in-house AND referred panels
 * both land on it. In-house panels get the usual empty result rows; referred
 * panels get an empty `referral` slot (see ReferralSchema) so one patient's
 * 4 booked tests -- 3 done here, 1 sent to a partner lab -- live on a single
 * report, and release can be gated on all 4 being complete. `panelDocs` are
 * full catalogue docs (they carry `.parameters`), not the frozen snapshots.
 */
async function createDraftReport({ accession, panelDocs, session, userId, note }) {
  const a = await actor(userId);
  const [report] = await PathologyReport.create(
    [
      {
        reportNo: accession.accessionNo.replace("RMDL", "RMDR"),
        accession: accession._id,
        accessionNo: accession.accessionNo,
        panels: buildReportPanels(panelDocs, accession.patient),
        status: "draft",
        audit: [{ action: "created", ...a, note: note || "Specimen registered" }],
      },
    ],
    { session }
  );
  return report;
}

/**
 * Register a walk-in specimen: the sample is physically in hand, so this mints
 * the accession, marks it collected + received now, computes the tube list and
 * creates the empty draft report the typist fills in.
 *
 * Booked orders take the pre-collection path instead -- see
 * `createCollectionLabel` / `receiveSpecimen`.
 */
export const createAccession = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      patient = {},
      panelIds = [],
      referringDoctor,
      notes,
      patientUser,
      labOrder,
    } = req.body || {};

    if (!patient.name) return fail(res, 400, "Patient name is required");
    const patientAge = Number(patient.age);
    if (!Number.isFinite(patientAge) || patientAge <= 0) {
      return fail(res, 400, "Patient age is required for reference-range matching");
    }
    if (!Array.isArray(panelIds) || panelIds.length === 0) {
      return fail(res, 400, "Select at least one test");
    }

    const panels = await PathologyPanel.find({ _id: { $in: panelIds }, isActive: true }).lean();
    if (panels.length !== panelIds.length) {
      return fail(res, 400, "One or more selected tests are unavailable");
    }

    let created;
    await session.withTransaction(async () => {
      const accessionNo = await generateAccessionNo();

      // Walk-in patients get an RMD id too, so every person in the system has
      // one whether or not they ever log in.
      let rmdId = patient.rmdId || null;
      if (!rmdId) rmdId = await generateUserRmdId();

      const now = new Date();
      const [accession] = await Accession.create(
        [
          {
            accessionNo,
            labOrder: labOrder || null,
            patientUser: patientUser || null,
            patient: { ...patient, rmdId },
            referringDoctor: referringDoctor || "SELF",
            panels: panels.map(toAccessionPanel),
            status: "registered",
            collectedAt: now,
            receivedAt: now,
            collectionInfo: {
              vials: computeVials(panels),
              categoryGroups: groupPanelsByCategory(panels),
              receivedBy: req.user?.id || null,
            },
            createdBy: req.user?.id || null,
            notes: notes || "",
          },
        ],
        { session }
      );

      const report = await createDraftReport({
        accession,
        panelDocs: panels,
        session,
        userId: req.user?.id,
      });

      created = { accession, report };
    });

    return ok(res, created, "Specimen registered");
  } catch (err) {
    console.error("createAccession error:", err);
    return fail(res, 500, "Failed to register specimen");
  } finally {
    session.endSession();
  }
};

/**
 * Print the sample-collection barcode label for a booked LabOrder. Mints the
 * accession up front -- before the specimen exists -- so the RM rider carries a
 * scannable label and a tube checklist. Idempotent: a second call returns the
 * accession already linked to the order (a reprint).
 */
export const createCollectionLabel = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { labOrder: labOrderId } = req.body || {};
    if (!labOrderId || !mongoose.Types.ObjectId.isValid(labOrderId)) {
      return fail(res, 400, "A valid labOrder id is required");
    }

    const order = await LabOrder.findById(labOrderId)
      .populate("items.testId", "name shortCode sampleType")
      .populate("userId", "name phone rmdId")
      .lean();
    if (!order) return fail(res, 404, "Lab order not found");

    const existing = await Accession.findOne({
      labOrder: labOrderId,
      status: { $ne: "cancelled" },
    }).lean();
    if (existing) {
      return ok(
        res,
        { accession: existing, unmatchedTests: existing.collectionInfo?.unmatchedTests || [] },
        "Collection label already generated"
      );
    }

    const { panels, unmatchedTests } = await matchPanelsForLabTests(order.items);
    if (panels.length === 0) {
      return fail(
        res,
        400,
        "None of the booked tests map to an in-house panel — register this specimen manually"
      );
    }

    let created;
    await session.withTransaction(async () => {
      const accessionNo = await generateAccessionNo();
      const addr = order.collectionAddress || {};
      const patient = {
        rmdId: order.userId?.rmdId || (await generateUserRmdId()),
        name: addr.fullName || order.userId?.name || "Patient",
        age: null,
        ageUnit: "years",
        sex: "male",
        phone: addr.phone || order.userId?.phone || null,
        address:
          [addr.addressLine1, addr.addressLine2, addr.pincode].filter(Boolean).join(", ") || null,
      };

      const [accession] = await Accession.create(
        [
          {
            accessionNo,
            labOrder: order._id,
            patientUser: order.userId?._id || null,
            patient,
            referringDoctor: "SELF",
            panels: panels.map(toAccessionPanel),
            status: "awaiting_collection",
            collectionInfo: {
              vials: computeVials(panels),
              categoryGroups: groupPanelsByCategory(panels),
              labelPrintedAt: new Date(),
              labelPrintedBy: req.user?.id || null,
              unmatchedTests,
            },
            createdBy: req.user?.id || null,
            notes: `Lab Booking #${String(order._id).slice(-6).toUpperCase()}`,
          },
        ],
        { session }
      );

      await LabOrder.findByIdAndUpdate(order._id, { accession: accession._id }, { session });
      created = { accession, unmatchedTests };
    });

    return ok(res, created, "Collection label generated");
  } catch (err) {
    console.error("createCollectionLabel error:", err);
    return fail(res, 500, "Failed to generate collection label");
  } finally {
    session.endSession();
  }
};

/**
 * The rider's collection sheet: who to visit, what to draw, which tubes.
 * Scoped -- an RM rider only sees a sheet for an order assigned to them; lab
 * staff and admins see any.
 */
export const getCollectionSheet = async (req, res) => {
  try {
    const { accessionNo } = req.params;
    const accession = await Accession.findOne({ accessionNo }).lean();
    if (!accession) return fail(res, 404, "Specimen not found");

    const order = accession.labOrder
      ? await LabOrder.findById(accession.labOrder)
          .select(
            "collectionType collectionAddress scheduledAt orderStatus otpVerified collectionAgentId"
          )
          .lean()
      : null;

    const rolesArr = [req.user?.dashboard, ...(req.user?.roles || [])];
    const isStaff = rolesArr.some((r) =>
      ["admin", "subadmin", "employee", "receptionist", "typist", "lab_technician"].includes(r)
    );
    if (!isStaff) {
      const uid = String(req.user?.id || req.user?._id || "");
      const assigned = order?.collectionAgentId && String(order.collectionAgentId) === uid;
      if (!assigned) return fail(res, 403, "This collection is not assigned to you");
    }

    return ok(res, {
      accessionNo: accession.accessionNo,
      status: accession.status,
      patient: accession.patient,
      referringDoctor: accession.referringDoctor,
      panels: (accession.panels || []).map((p) => ({
        code: p.code,
        name: p.name,
        category: p.category || "",
        isInHouse: p.isInHouse,
      })),
      vials: accession.collectionInfo?.vials || [],
      categoryGroups: accession.collectionInfo?.categoryGroups || [],
      unmatchedTests: accession.collectionInfo?.unmatchedTests || [],
      order: order
        ? {
            orderId: order._id,
            collectionType: order.collectionType,
            collectionAddress: order.collectionAddress,
            scheduledAt: order.scheduledAt,
            orderStatus: order.orderStatus,
            otpRequired: !order.otpVerified,
          }
        : null,
    });
  } catch (err) {
    console.error("getCollectionSheet error:", err);
    return fail(res, 500, "Failed to load collection sheet");
  }
};

const RECEIVABLE = new Set(["awaiting_collection", "collected"]);

/**
 * Lab receiving bench: scan the returned tube, confirm the patient's age/sex
 * and panel list, mark the specimen received. This is the point the draft
 * report is created and value entry can begin.
 */
export const receiveSpecimen = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { accessionNo } = req.params;
    const { patient = {}, panelIds, notes } = req.body || {};

    const accession = await Accession.findOne({ accessionNo });
    if (!accession) return fail(res, 404, "Specimen not found");

    if (!RECEIVABLE.has(accession.status)) {
      if (accession.status === "cancelled") return fail(res, 409, "This specimen is cancelled");
      // Already received -- hand back what exists rather than erroring.
      const report = await PathologyReport.findOne({ accession: accession._id }).lean();
      return ok(res, { accession: accession.toObject(), report }, "Specimen already received");
    }

    const existingPatient =
      typeof accession.patient?.toObject === "function"
        ? accession.patient.toObject()
        : accession.patient || {};
    const mergedPatient = { ...existingPatient, ...patient };
    const age = Number(mergedPatient.age);
    if (!Number.isFinite(age) || age <= 0) {
      return fail(res, 400, "Patient age is required for reference-range matching");
    }

    let panelDocs;
    if (Array.isArray(panelIds) && panelIds.length) {
      panelDocs = await PathologyPanel.find({ _id: { $in: panelIds }, isActive: true }).lean();
      if (panelDocs.length !== panelIds.length) {
        return fail(res, 400, "One or more selected tests are unavailable");
      }
    } else {
      panelDocs = await PathologyPanel.find({
        _id: { $in: accession.panels.map((p) => p.panel) },
        isActive: true,
      }).lean();
    }
    if (panelDocs.length === 0) return fail(res, 400, "Select at least one test");

    let result;
    await session.withTransaction(async () => {
      accession.patient = mergedPatient;
      accession.panels = panelDocs.map(toAccessionPanel);
      if (!accession.collectionInfo) accession.collectionInfo = {};
      accession.collectionInfo.vials = computeVials(panelDocs);
      accession.collectionInfo.categoryGroups = groupPanelsByCategory(panelDocs);
      accession.collectionInfo.receivedBy = req.user?.id || null;
      accession.status = "registered";
      if (!accession.collectedAt) accession.collectedAt = new Date();
      accession.receivedAt = new Date();
      if (notes) accession.notes = notes;
      await accession.save({ session });

      const report = await createDraftReport({
        accession,
        panelDocs,
        session,
        userId: req.user?.id,
        note: "Specimen received at lab",
      });
      result = { accession: accession.toObject(), report };
    });

    // Keep the customer booking in step.
    if (accession.labOrder) {
      await LabOrder.findOneAndUpdate(
        { _id: accession.labOrder, orderStatus: "SAMPLE_COLLECTED" },
        { orderStatus: "REPORT_PENDING" }
      );
    }

    return ok(res, result, "Specimen received");
  } catch (err) {
    console.error("receiveSpecimen error:", err);
    return fail(res, 500, "Failed to receive specimen");
  } finally {
    session.endSession();
  }
};

/** Barcode scan / manual search: accession no, RMD id, phone or name. */
export const searchAccessions = async (req, res) => {
  try {
    const { q, status, labOrder, limit = 40 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (labOrder) filter.labOrder = labOrder;

    if (q) {
      const rx = { $regex: String(q).trim(), $options: "i" };
      filter.$or = [
        { accessionNo: rx },
        { "patient.rmdId": rx },
        { "patient.phone": rx },
        { "patient.name": rx },
      ];
    }

    const accessions = await Accession.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 40, 100))
      .lean();

    const reports = await PathologyReport.find({
      accession: { $in: accessions.map((a) => a._id) },
    })
      .select("accession status reportNo submittedAt verifiedAt sentAt")
      .lean();

    const byAccession = new Map(reports.map((r) => [String(r.accession), r]));
    const rows = accessions.map((a) => ({
      ...a,
      report: byAccession.get(String(a._id)) || null,
    }));

    return ok(res, { accessions: rows });
  } catch (err) {
    console.error("searchAccessions error:", err);
    return fail(res, 500, "Search failed");
  }
};

export const getAccession = async (req, res) => {
  try {
    const { accessionNo } = req.params;
    const accession = await Accession.findOne({ accessionNo }).lean();
    if (!accession) return fail(res, 404, "Specimen not found");

    const report = await PathologyReport.findOne({ accession: accession._id }).lean();
    return ok(res, { accession, report });
  } catch (err) {
    console.error("getAccession error:", err);
    return fail(res, 500, "Failed to load specimen");
  }
};

/** Track a referred-out panel (e.g. LFT) through the partner lab. */
export const updateReferral = async (req, res) => {
  try {
    const { accessionNo, code } = req.params;
    const { referralStatus, referralLab } = req.body || {};

    const accession = await Accession.findOne({ accessionNo });
    if (!accession) return fail(res, 404, "Specimen not found");

    const p = accession.panels.find((x) => x.code === String(code).toUpperCase());
    if (!p) return fail(res, 404, "Test not on this specimen");
    if (p.isInHouse) return fail(res, 400, "This test is performed in-house");

    if (referralStatus) p.referralStatus = referralStatus;
    if (referralLab) p.referralLab = referralLab;
    if (referralStatus === "dispatched") p.dispatchedAt = new Date();
    if (referralStatus === "received") p.resultReceivedAt = new Date();

    await accession.save();
    return ok(res, { accession }, "Referral updated");
  } catch (err) {
    console.error("updateReferral error:", err);
    return fail(res, 500, "Failed to update referral");
  }
};

/* ========================= REPORT WORKFLOW ========================= */

/** Look up a referred-out panel on a report, or the (code, message) to fail with. */
const findReferralPanel = (report, code) => {
  const panel = report.panels.find((x) => x.code === String(code || "").toUpperCase());
  if (!panel) return [null, 404, "Test not on this report"];
  if (panel.isInHouse) return [null, 400, "This test is performed in-house and has no referral upload"];
  return [panel, null, null];
};

/**
 * Keep `Accession.panels[].referralStatus` (the specimen-logistics tracker,
 * shown on the specimens list / search screens) in step with the report-level
 * referral upload/verify above -- otherwise a panel sits at "Pending Dispatch"
 * forever even after its report has been uploaded and verified.
 */
async function syncAccessionReferralStatus(accessionId, code, status) {
  const accession = await Accession.findById(accessionId);
  if (!accession) return;
  const p = accession.panels.find((x) => x.code === code);
  if (!p) return;
  p.referralStatus = status;
  if (status === "dispatched") p.dispatchedAt = p.dispatchedAt || new Date();
  if (status === "received") p.resultReceivedAt = new Date();
  await accession.save();
}

/**
 * Upload the partner lab's own report for one referred-out panel (e.g. LFT).
 * Data entry or the lab technician does this the moment the physical/scanned
 * report comes back -- it does not by itself complete the panel, a staff
 * member still has to verify it's this patient's report (see below).
 */
export const uploadReferralReport = async (req, res) => {
  try {
    const { id, code } = req.params;
    const report = await PathologyReport.findById(id);
    if (!report) return fail(res, 404, "Report not found");
    if (report.status === "released") return fail(res, 409, "Report is released and cannot be edited");

    const [panel, errCode, errMsg] = findReferralPanel(report, code);
    if (!panel) return fail(res, errCode, errMsg);

    if (!req.file) return fail(res, 400, "Report file is required");

    if (panel.referral?.reportKey) await deleteReferralReportFromS3(panel.referral.reportKey);

    const result = await uploadReferralReportToS3({
      reportId: report._id,
      code: panel.code,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
    });

    panel.referral.status = "uploaded";
    panel.referral.reportUrl = result.url;
    panel.referral.reportKey = result.key;
    panel.referral.uploadedAt = new Date();
    panel.referral.uploadedBy = req.user?.id || null;
    // A re-upload (e.g. correcting a mismatch) needs re-checking.
    panel.referral.verifiedAt = null;
    panel.referral.verifiedBy = null;
    panel.referral.patientNameMatched = false;

    const a = await actor(req.user?.id);
    report.audit.push({ action: "referral_uploaded", ...a, note: `${panel.code} report uploaded` });

    await report.save();
    // The partner lab's result is in hand now, so the specimen tracker moves
    // past "Pending Dispatch" too -- this used to be left stuck there.
    await syncAccessionReferralStatus(report.accession, panel.code, "received");
    return ok(res, { report }, "Referral report uploaded");
  } catch (err) {
    console.error("uploadReferralReport error:", err);
    return fail(res, 500, "Failed to upload referral report");
  } finally {
    await cleanupUploadedFile(req);
  }
};

/**
 * Staff confirms (or flags) that the uploaded partner-lab report actually
 * belongs to this patient -- the check the lab asked for before a referred
 * result counts as done. A mismatch bounces the panel back to
 * `awaiting_report` so a corrected file gets uploaded instead of leaving a
 * wrong report attached.
 */
export const verifyReferralReport = async (req, res) => {
  try {
    const { id, code } = req.params;
    const { patientNameMatched, notes } = req.body || {};
    const report = await PathologyReport.findById(id);
    if (!report) return fail(res, 404, "Report not found");
    if (report.status === "released") return fail(res, 409, "Report is released and cannot be edited");
    if (!isTechnician(req.user)) {
      return fail(res, 403, "Only a lab technician can verify a referred report");
    }

    const [panel, errCode, errMsg] = findReferralPanel(report, code);
    if (!panel) return fail(res, errCode, errMsg);
    if (!panel.referral?.reportUrl) return fail(res, 400, "Upload the referral report before verifying it");

    const a = await actor(req.user?.id);

    if (patientNameMatched === false) {
      panel.referral.status = "awaiting_report";
      panel.referral.verifiedAt = null;
      panel.referral.verifiedBy = null;
      panel.referral.patientNameMatched = false;
      panel.referral.notes = notes || "Patient name mismatch -- re-check with the partner lab";
      report.audit.push({ action: "referral_verified", ...a, note: `${panel.code}: name mismatch, re-upload required` });
    } else {
      panel.referral.status = "verified";
      panel.referral.verifiedAt = new Date();
      panel.referral.verifiedBy = req.user?.id || null;
      panel.referral.patientNameMatched = true;
      panel.referral.notes = notes || "";
      report.audit.push({ action: "referral_verified", ...a, note: `${panel.code}: patient details confirmed` });
    }

    await report.save();
    // A confirmed mismatch means the specimen tracker should go back to
    // "Dispatched" (still out with the partner lab, awaiting a corrected
    // report) rather than staying on "Received" against a report we just
    // rejected.
    await syncAccessionReferralStatus(
      report.accession,
      panel.code,
      patientNameMatched === false ? "dispatched" : "received"
    );
    return ok(res, { report }, "Referral verification saved");
  } catch (err) {
    console.error("verifyReferralReport error:", err);
    return fail(res, 500, "Failed to verify referral report");
  }
};

export const getReport = async (req, res) => {
  try {
    const report = await PathologyReport.findById(req.params.id).lean();
    if (!report) {
      console.warn(`getReport: no report ${req.params.id} (user ${req.user?.id})`);
      return fail(res, 404, "Report not found");
    }
    const accession = await Accession.findById(report.accession).lean();

    // A plain patient/user may only ever see their own released report --
    // everything before release is staff-only. Staff = any lab role, admin,
    // or a custom role carrying a pathology permission (e.g. receptionist).
    const perms = req.user?.permissions || [];
    const isStaff =
      isTypist(req.user) ||
      isDoctor(req.user) ||
      perms.some((p) => p === "*" || p === "*:*" || p.startsWith("pathology."));

    if (!isStaff) {
      const me = await User.findById(req.user.id).select("phone").lean();
      if (report.status !== "released" || !ownsAccession(accession, { id: req.user.id, phone: me?.phone })) {
        console.warn(
          `getReport: blocked non-staff user ${req.user?.id} from report ${req.params.id} (status ${report.status})`
        );
        return fail(res, 404, "Report not found");
      }
    }

    // Staff needs to see whether the booking is paid, to know if the release
    // button is payment-gated (patients never see an unreleased report anyway).
    if (isStaff && accession?.labOrder) {
      const order = await LabOrder.findById(accession.labOrder).select("paymentStatus paymentMode").lean();
      if (order) {
        accession.paymentStatus = order.paymentStatus;
        accession.paymentMode = order.paymentMode;
      }
    }

    return ok(res, { report, accession });
  } catch (err) {
    console.error("getReport error:", err);
    return fail(res, 500, "Failed to load report");
  }
};

/** Worklist. Typists see what needs entry; technicians see the queue. */
export const listReports = async (req, res) => {
  try {
    const { status, q, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") {
      // Grouped worklist tabs pass a comma list, e.g. "pending_doctor,doctor_review".
      const list = String(status).split(",").map((s) => s.trim()).filter(Boolean);
      filter.status = list.length > 1 ? { $in: list } : list[0];
    }
    if (q) filter.accessionNo = { $regex: String(q).trim(), $options: "i" };

    const reports = await PathologyReport.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();

    const accessions = await Accession.find({ _id: { $in: reports.map((r) => r.accession) } })
      .select("accessionNo patient referringDoctor createdAt panels")
      .lean();

    const byId = new Map(accessions.map((a) => [String(a._id), a]));
    const rows = reports.map((r) => ({
      ...r,
      accessionDoc: byId.get(String(r.accession)) || null,
    }));

    return ok(res, { reports: rows });
  } catch (err) {
    console.error("listReports error:", err);
    return fail(res, 500, "Failed to load worklist");
  }
};

/**
 * Save entered values. Used by the typist (draft) and by the technician while
 * reviewing. A technician editing a submitted report marks each changed row,
 * so the audit trail shows exactly what was corrected.
 */
export const saveReportValues = async (req, res) => {
  try {
    const { values = {}, remarks } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");

    const admin = isAdmin(req.user);
    const technician = isTechnician(req.user);
    const operatorOnly = isTypist(req.user) && !technician;

    if (report.status === "released") {
      return fail(res, 409, "Report is released and cannot be edited");
    }
    // Admin has full access and can correct values at any pre-release stage.
    if (!admin) {
      if (operatorOnly && !OPERATOR_EDIT.has(report.status)) {
        return fail(res, 403, "This report has left data entry and is read-only for you");
      }
      if (technician && !TECHNICIAN_EDIT.has(report.status)) {
        return fail(res, 403, `A ${report.status} report cannot be edited here`);
      }
      if (!technician && !operatorOnly) {
        return fail(res, 403, "Not permitted to enter results");
      }
    }

    // A technician correcting a value after it has left data entry marks the
    // row, so the audit trail and the print show exactly what changed.
    const markEdits = technician && report.status !== "draft";

    let changed = 0;
    for (const p of report.panels) {
      for (const r of p.results) {
        const key = `${p.code}.${r.parameterCode || r.parameterName}`;
        if (!(key in values)) continue;

        const incoming = values[key];
        if (String(r.value ?? "") === String(incoming ?? "")) continue;

        if (markEdits) {
          r.previousValue = r.value;
          r.editedByTechnician = true;
        }
        r.value = incoming === "" ? null : incoming;
        changed += 1;
      }
    }

    recalcReportPanels(report.panels);
    if (remarks !== undefined) report.remarks = remarks;

    // First technician touch on an incoming report moves it into review.
    if (technician && report.status === "pending_technician") {
      report.status = "technician_review";
    }

    const a = await actor(req.user?.id);
    report.audit.push({
      action: report.status === "draft" ? "saved_draft" : "edited",
      ...a,
      note: `${changed} value(s) updated`,
    });

    await report.save();
    return ok(res, { report }, "Saved");
  } catch (err) {
    console.error("saveReportValues error:", err);
    return fail(res, 500, "Failed to save report");
  }
};

/**
 * Typist submit -- deliberately the furthest a typist can move a report.
 * It never sends anything to the patient.
 */
export const submitReport = async (req, res) => {
  try {
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTypist(req.user)) return fail(res, 403, "Not permitted");
    if (report.status !== "draft" && report.status !== "rejected") {
      return fail(res, 409, `Report is already ${report.status}`);
    }

    const missing = [];
    for (const p of report.panels) {
      for (const r of p.results) {
        if (r.value === null || r.value === "") missing.push(`${p.code}: ${r.parameterName}`);
      }
    }
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `${missing.length} value(s) still empty`,
        missing,
      });
    }

    recalcReportPanels(report.panels);
    report.status = "pending_technician";
    report.typist = req.user.id;
    report.submittedAt = new Date();
    report.rejectionReason = "";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "sent_to_technician", ...a, note: "Sent to lab technician" });

    await report.save();
    await Accession.findByIdAndUpdate(report.accession, { status: "in_progress" });

    return ok(res, { report }, "Sent to lab technician");
  } catch (err) {
    console.error("submitReport error:", err);
    return fail(res, 500, "Failed to submit report");
  }
};

const TECH_VERIFY_FROM = new Set(["pending_technician", "technician_review", "returned"]);

/** Stage 2, gate A -- technician verifies the entered values. */
export const verifyReport = async (req, res) => {
  try {
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user)) {
      return fail(res, 403, "Only a lab technician can verify reports");
    }
    if (!TECH_VERIFY_FROM.has(report.status)) {
      return fail(res, 409, `Cannot verify a report that is ${report.status}`);
    }

    const missing = [];
    for (const p of report.panels) {
      for (const r of p.results) {
        if (r.value === null || r.value === "") missing.push(`${p.code}: ${r.parameterName}`);
      }
    }
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `${missing.length} value(s) still empty`,
        missing,
      });
    }

    recalcReportPanels(report.panels);
    report.status = "lab_verified";
    report.technician = req.user.id;
    report.verifiedAt = new Date();
    report.returnReason = "";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "lab_verified", ...a, note: req.body?.note || "" });

    await report.save();
    return ok(res, { report }, "Lab verified");
  } catch (err) {
    console.error("verifyReport error:", err);
    return fail(res, 500, "Failed to verify report");
  }
};

/** Stage 2, gate B -- technician hands the verified report to the doctor. */
export const sendToDoctor = async (req, res) => {
  try {
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user)) {
      return fail(res, 403, "Only a lab technician can send reports to the doctor");
    }
    if (report.status !== "lab_verified") {
      return fail(res, 409, "Report must be lab verified before it goes to the doctor");
    }

    report.status = "pending_doctor";
    report.sentToDoctorAt = new Date();

    const a = await actor(req.user?.id);
    report.audit.push({ action: "sent_to_doctor", ...a, note: "Sent for final verification" });

    await report.save();
    return ok(res, { report }, "Sent to doctor");
  } catch (err) {
    console.error("sendToDoctor error:", err);
    return fail(res, 500, "Failed to send report to doctor");
  }
};

/** Technician bounces the entered values back to the data entry operator. */
export const rejectReport = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user)) return fail(res, 403, "Only a lab technician can return a report");
    if (!["pending_technician", "technician_review"].includes(report.status)) {
      return fail(res, 409, "Only a report awaiting the technician can be returned to data entry");
    }

    report.status = "rejected";
    report.rejectionReason = reason || "Values need correction";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "rejected", ...a, note: report.rejectionReason });

    await report.save();
    return ok(res, { report }, "Returned to data entry");
  } catch (err) {
    console.error("rejectReport error:", err);
    return fail(res, 500, "Failed to return report");
  }
};

const DOCTOR_STAGE = new Set(["pending_doctor", "doctor_review"]);

/** Doctor jots review notes without yet deciding. Moves it into DOCTOR REVIEW. */
export const saveDoctorRemarks = async (req, res) => {
  try {
    const { doctorRemarks } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isDoctor(req.user)) return fail(res, 403, "Only a doctor can add final remarks");
    if (!DOCTOR_STAGE.has(report.status)) {
      return fail(res, 409, `A ${report.status} report is not with the doctor`);
    }

    report.doctorRemarks = doctorRemarks || "";
    if (report.status === "pending_doctor") report.status = "doctor_review";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "doctor_remarks", ...a, note: "Doctor remarks updated" });

    await report.save();
    return ok(res, { report }, "Remarks saved");
  } catch (err) {
    console.error("saveDoctorRemarks error:", err);
    return fail(res, 500, "Failed to save remarks");
  }
};

/** Stage 3, gate A -- doctor / pathologist final verification. */
export const finalVerifyReport = async (req, res) => {
  try {
    const { doctorRemarks } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isDoctor(req.user)) return fail(res, 403, "Only a doctor can final-verify a report");
    if (!DOCTOR_STAGE.has(report.status)) {
      return fail(res, 409, `Cannot final-verify a report that is ${report.status}`);
    }

    recalcReportPanels(report.panels);
    report.status = "final_verified";
    report.doctor = req.user.id;
    report.finalVerifiedAt = new Date();
    if (doctorRemarks !== undefined) report.doctorRemarks = doctorRemarks || "";
    report.returnReason = "";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "final_verified", ...a, note: req.body?.note || "" });

    await report.save();
    return ok(res, { report }, "Final verified");
  } catch (err) {
    console.error("finalVerifyReport error:", err);
    return fail(res, 500, "Failed to final-verify report");
  }
};

/** Stage 3, gate B -- doctor bounces the report back to the lab technician. */
export const returnToTechnician = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isDoctor(req.user)) return fail(res, 403, "Only a doctor can return a report to the lab");
    if (!DOCTOR_STAGE.has(report.status)) {
      return fail(res, 409, "Only a report with the doctor can be returned to the lab");
    }

    report.status = "returned";
    report.returnReason = reason || "Requires correction";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "returned_by_doctor", ...a, note: report.returnReason });

    await report.save();
    return ok(res, { report }, "Returned to lab technician");
  } catch (err) {
    console.error("returnToTechnician error:", err);
    return fail(res, 500, "Failed to return report");
  }
};

/**
 * Release the final-verified report to the patient. Allowed for the technician,
 * the doctor and admins. Also flips the originating booking (if any) to
 * REPORT_READY so the existing customer flow stays in sync.
 */
export const releaseReport = async (req, res) => {
  try {
    const { channels = ["whatsapp"] } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user) && !isDoctor(req.user)) {
      return fail(res, 403, "Not permitted to release reports");
    }
    if (report.status !== "final_verified") {
      return fail(res, 409, "Report must be doctor final-verified before release");
    }

    const pending = pendingReferrals(report.panels);
    if (pending.length) {
      return fail(
        res,
        409,
        `Referred report(s) not uploaded/verified yet: ${pending.map((p) => p.code).join(", ")}`
      );
    }

    // Payment gate: a booked order must be paid before its report goes out.
    // Only an admin may force a release while payment is still pending.
    const accessionForPayment = await Accession.findById(report.accession).select("labOrder");
    const order = accessionForPayment?.labOrder
      ? await LabOrder.findById(accessionForPayment.labOrder).select("paymentStatus")
      : null;
    const unpaid = !!order && order.paymentStatus !== "PAID";

    if (unpaid && !isAdmin(req.user)) {
      return fail(res, 402, "Payment pending -- report cannot be released until payment is received");
    }

    report.status = "released";
    report.sentAt = new Date();
    report.sentChannels = Array.from(new Set([...(report.sentChannels || []), ...channels]));

    const a = await actor(req.user?.id);
    report.audit.push({
      action: "released",
      ...a,
      note: unpaid ? `${channels.join(", ")} (admin override -- payment pending)` : channels.join(", "),
    });

    await report.save();

    const accession = await Accession.findByIdAndUpdate(
      report.accession,
      { status: "reported" },
      { returnDocument: "after" }
    );

    if (accession?.labOrder) {
      await LabOrder.findByIdAndUpdate(accession.labOrder, { orderStatus: "REPORT_READY" });
    }

    return ok(res, { report }, "Report released");
  } catch (err) {
    console.error("releaseReport error:", err);
    return fail(res, 500, "Failed to release report");
  }
};

/* ========================= PATIENT / USER ========================= */

/** Match a released report's accession to the logged-in user. */
const ownsAccession = (accession, user) => {
  if (!accession) return false;
  if (accession.patientUser && String(accession.patientUser) === String(user.id)) return true;
  const phone = String(user.phone || "").replace(/\D/g, "").slice(-10);
  const accPhone = String(accession.patient?.phone || "").replace(/\D/g, "").slice(-10);
  return Boolean(phone) && phone === accPhone;
};

/** The patient's own released reports. */
export const listMyReports = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("phone").lean();
    const phone = String(me?.phone || "").replace(/\D/g, "").slice(-10);

    const or = [{ patientUser: req.user.id }];
    if (phone) or.push({ "patient.phone": { $regex: `${phone}$` } });

    const accessions = await Accession.find({ $or: or }).select("_id accessionNo patient").lean();
    if (!accessions.length) return ok(res, { reports: [] });

    const reports = await PathologyReport.find({
      accession: { $in: accessions.map((a) => a._id) },
      status: "released",
    })
      .sort({ sentAt: -1 })
      .lean();

    const byId = new Map(accessions.map((a) => [String(a._id), a]));
    const rows = reports.map((r) => ({ ...r, accessionDoc: byId.get(String(r.accession)) || null }));

    return ok(res, { reports: rows });
  } catch (err) {
    console.error("listMyReports error:", err);
    return fail(res, 500, "Failed to load your reports");
  }
};

/** One released report, only if it belongs to the caller. */
export const getMyReport = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("phone").lean();
    const report = await PathologyReport.findById(req.params.id).lean();
    if (!report || report.status !== "released") return fail(res, 404, "Report not found");

    const accession = await Accession.findById(report.accession).lean();
    if (!ownsAccession(accession, { id: req.user.id, phone: me?.phone })) {
      return fail(res, 404, "Report not found");
    }

    return ok(res, { report, accession });
  } catch (err) {
    console.error("getMyReport error:", err);
    return fail(res, 500, "Failed to load report");
  }
};

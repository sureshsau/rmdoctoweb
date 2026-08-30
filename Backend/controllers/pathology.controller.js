import mongoose from "mongoose";
import PathologyPanel from "../models/lab/pathologyPanel.model.js";
import Accession from "../models/lab/accession.model.js";
import PathologyReport from "../models/lab/pathologyReport.model.js";
import LabOrder from "../models/lab/labOrder.model.js";
import User from "../models/user.model.js";
import { generateAccessionNo, generateUserRmdId } from "../utils/rmdId.js";
import { buildReportPanels, recalcReportPanels } from "../services/pathology.service.js";

const ok = (res, data, message = "OK") =>
  res.status(200).json({ success: true, message, ...data });

const fail = (res, code, message) =>
  res.status(code).json({ success: false, message });

const isTechnician = (u) =>
  u?.dashboard === "lab_technician" ||
  u?.roles?.includes("lab_technician") ||
  u?.roles?.includes("admin") ||
  u?.roles?.includes("subadmin");

const isTypist = (u) =>
  u?.dashboard === "typist" || u?.roles?.includes("typist") || isTechnician(u);

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

export const upsertPanel = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    if (!payload.code || !payload.name || !payload.category) {
      return fail(res, 400, "code, name and category are required");
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

/**
 * Register a specimen. Mints the accession number the barcode is printed
 * from, snapshots in-house vs referral routing per panel, and creates the
 * empty draft report the typist will fill in.
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

      const accessionPanels = panels.map((p) => ({
        panel: p._id,
        code: p.code,
        name: p.name,
        isInHouse: p.isInHouse,
        referralLab: p.isInHouse ? { name: null, contact: null } : p.referralLab,
        referralStatus: p.isInHouse ? "not_applicable" : "pending_dispatch",
      }));

      const [accession] = await Accession.create(
        [
          {
            accessionNo,
            labOrder: labOrder || null,
            patientUser: patientUser || null,
            patient: { ...patient, rmdId },
            referringDoctor: referringDoctor || "SELF",
            panels: accessionPanels,
            createdBy: req.user?.id || null,
            notes: notes || "",
          },
        ],
        { session }
      );

      // The report covers in-house panels only; referred-out work is tracked
      // on the accession until the partner lab returns a result.
      const inHouse = panels.filter((p) => p.isInHouse);
      const a = await actor(req.user?.id);

      const [report] = await PathologyReport.create(
        [
          {
            reportNo: accessionNo.replace("RMDL", "RMDR"),
            accession: accession._id,
            accessionNo,
            panels: buildReportPanels(inHouse, accession.patient),
            status: "draft",
            audit: [{ action: "created", ...a, note: "Specimen registered" }],
          },
        ],
        { session }
      );

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

export const getReport = async (req, res) => {
  try {
    const report = await PathologyReport.findById(req.params.id).lean();
    if (!report) return fail(res, 404, "Report not found");
    const accession = await Accession.findById(report.accession).lean();
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
    if (status && status !== "all") filter.status = status;
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

    const technician = isTechnician(req.user);

    if (report.status === "sent") {
      return fail(res, 409, "Report already sent and cannot be edited");
    }
    if ((report.status === "submitted" || report.status === "verified") && !technician) {
      return fail(res, 403, "Only a lab technician can edit this report");
    }
    if (!isTypist(req.user)) return fail(res, 403, "Not permitted to enter results");

    let changed = 0;
    for (const p of report.panels) {
      for (const r of p.results) {
        const key = `${p.code}.${r.parameterCode || r.parameterName}`;
        if (!(key in values)) continue;

        const incoming = values[key];
        if (String(r.value ?? "") === String(incoming ?? "")) continue;

        if (report.status !== "draft" && technician) {
          r.previousValue = r.value;
          r.editedByTechnician = true;
        }
        r.value = incoming === "" ? null : incoming;
        changed += 1;
      }
    }

    recalcReportPanels(report.panels);
    if (remarks !== undefined) report.remarks = remarks;

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
    report.status = "submitted";
    report.typist = req.user.id;
    report.submittedAt = new Date();
    report.rejectionReason = "";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "submitted", ...a, note: "Sent for technician verification" });

    await report.save();
    await Accession.findByIdAndUpdate(report.accession, { status: "in_progress" });

    return ok(res, { report }, "Submitted for verification");
  } catch (err) {
    console.error("submitReport error:", err);
    return fail(res, 500, "Failed to submit report");
  }
};

/** Technician gate #1 -- verify (or bounce back to the typist). */
export const verifyReport = async (req, res) => {
  try {
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user)) {
      return fail(res, 403, "Only a lab technician can verify reports");
    }
    if (report.status !== "submitted") {
      return fail(res, 409, `Cannot verify a report that is ${report.status}`);
    }

    recalcReportPanels(report.panels);
    report.status = "verified";
    report.technician = req.user.id;
    report.verifiedAt = new Date();

    const a = await actor(req.user?.id);
    report.audit.push({ action: "verified", ...a, note: req.body?.note || "" });

    await report.save();
    return ok(res, { report }, "Report verified");
  } catch (err) {
    console.error("verifyReport error:", err);
    return fail(res, 500, "Failed to verify report");
  }
};

export const rejectReport = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user)) return fail(res, 403, "Only a lab technician can reject");
    if (report.status !== "submitted") {
      return fail(res, 409, "Only submitted reports can be rejected");
    }

    report.status = "rejected";
    report.rejectionReason = reason || "Values need correction";

    const a = await actor(req.user?.id);
    report.audit.push({ action: "rejected", ...a, note: report.rejectionReason });

    await report.save();
    return ok(res, { report }, "Sent back to typist");
  } catch (err) {
    console.error("rejectReport error:", err);
    return fail(res, 500, "Failed to reject report");
  }
};

/**
 * Technician gate #2 -- release to the patient. Also flips the originating
 * booking (if any) to REPORT_READY so the existing customer flow stays in sync.
 */
export const sendReport = async (req, res) => {
  try {
    const { channels = ["whatsapp"] } = req.body || {};
    const report = await PathologyReport.findById(req.params.id);
    if (!report) return fail(res, 404, "Report not found");
    if (!isTechnician(req.user)) {
      return fail(res, 403, "Only a lab technician can send reports");
    }
    if (report.status !== "verified") {
      return fail(res, 409, "Report must be verified before sending");
    }

    report.status = "sent";
    report.sentAt = new Date();
    report.sentChannels = Array.from(new Set([...(report.sentChannels || []), ...channels]));

    const a = await actor(req.user?.id);
    report.audit.push({ action: "sent", ...a, note: channels.join(", ") });

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
    console.error("sendReport error:", err);
    return fail(res, 500, "Failed to send report");
  }
};

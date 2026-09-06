import { s3 } from "../config/aws.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import PathologyReport from "../models/lab/pathologyReport.model.js";
import Accession from "../models/lab/accession.model.js";
import LabOrder from "../models/lab/labOrder.model.js";

/**
 * Pathology domain logic: reference-range resolution, flagging and formula
 * evaluation. Kept free of Express so it can be unit-tested and reused by
 * anything that ingests referred-out results later.
 */

const toYears = (age, unit) => {
  if (age === null || age === undefined) return null;
  if (unit === "months") return age / 12;
  if (unit === "days") return age / 365;
  return age;
};

/**
 * Most-specific range wins: an exact sex + age-window match beats a sex-only
 * match, which beats the catch-all. Returns null when the parameter has no
 * ranges (free-text fields like "Appearance").
 */
export function resolveRange(parameter, patient = {}) {
  const ranges = parameter?.ranges || [];
  if (!ranges.length) return null;

  const sex = (patient.sex || "male").toLowerCase();
  const ageY = toYears(patient.age, patient.ageUnit || "years");

  // `ignoreAge` is the fallback pass: when the patient's age is unknown we
  // still want a sex-matched range rather than nothing, so age windows stop
  // disqualifying (they just score no bonus).
  const score = (r, ignoreAge) => {
    let s = 0;
    if (r.sex && r.sex !== "any") {
      if (r.sex !== sex) return -1; // disqualified
      s += 2;
    }
    const hasWindow = r.minAgeYears !== null || r.maxAgeYears !== null;
    if (hasWindow && !ignoreAge) {
      if (ageY === null) return -1;
      if (r.minAgeYears !== null && ageY < r.minAgeYears) return -1;
      if (r.maxAgeYears !== null && ageY > r.maxAgeYears) return -1;
      s += 3;
    }
    return s;
  };

  const pick = (ignoreAge) => {
    let best = null;
    let bestScore = -1;
    for (const r of ranges) {
      const s = score(r, ignoreAge);
      if (s > bestScore) {
        bestScore = s;
        best = r;
      }
    }
    return bestScore < 0 ? null : best;
  };

  return pick(false) || (ageY === null ? pick(true) : null);
}

/** Human-readable range for the printed report. */
export function formatRange(range) {
  if (!range) return "";
  if (range.display) return range.display;
  const { low, high } = range;
  if (low !== null && high !== null) return `${low} - ${high}`;
  if (low !== null) return `> ${low}`;
  if (high !== null) return `< ${high}`;
  return "";
}

/**
 * Flag a value against its range. Anything beyond 1.5x outside the band is
 * escalated to critical so the technician sees it before releasing.
 */
export function computeFlag(value, range, valueType = "numeric") {
  if (value === null || value === undefined || value === "") return "";
  if (valueType !== "numeric" && valueType !== "formula") return "";
  if (!range) return "";

  const v = Number(value);
  if (!Number.isFinite(v)) return "";

  const { low, high } = range;
  const span = low !== null && high !== null ? high - low : null;

  if (high !== null && v > high) {
    if (span && v > high + span * 0.5) return "critical_high";
    return "high";
  }
  if (low !== null && v < low) {
    if (span && v < low - span * 0.5) return "critical_low";
    return "low";
  }
  return "normal";
}

/**
 * Evaluate `formula` parameters against sibling values. Deliberately not
 * eval(): only numbers, parameter codes and + - * / ( ) survive the guard, so
 * a malformed catalogue entry cannot execute arbitrary code.
 */
export function evaluateFormula(formula, valuesByCode) {
  if (!formula) return null;

  const substituted = formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (token) => {
    const raw = valuesByCode[token];
    const n = Number(raw);
    return Number.isFinite(n) ? String(n) : "NaN";
  });

  if (!/^[0-9+\-*/(). NaN]+$/.test(substituted)) return null;
  if (substituted.includes("NaN")) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${substituted});`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Standard phlebotomy tube colour for a panel's container additive. Matched by
 * case-insensitive substring so catalogue text like "K2EDTA" or "Sodium
 * Fluoride / Potassium Oxalate" still resolves. Order matters -- the first hit
 * wins.
 */
const CONTAINER_COLORS = [
  [/edta/i, "Lavender"],
  [/citrate/i, "Light Blue"],
  [/fluoride|oxalate|\bfx\b/i, "Grey"],
  [/heparin/i, "Green"],
  [/sst|gel|separator/i, "Gold"],
  [/plain|clot|serum|no additive/i, "Red"],
  [/urine/i, "Yellow"],
  [/stool|sterile|swab/i, "White"],
];

export function containerColor(container) {
  const text = String(container || "").trim();
  if (!text) return "—";
  for (const [rx, color] of CONTAINER_COLORS) if (rx.test(text)) return color;
  return "—";
}

/**
 * Collapse a set of panels into the tube checklist a phlebotomist draws: one
 * vial per distinct container, tagged with its colour and the panels that go
 * into it. `count` is 1 per tube for now; the lab can revise volumes later.
 */
export function computeVials(panels = []) {
  const byContainer = new Map();
  for (const p of panels) {
    const container = String(p.container || "").trim() || "Plain";
    if (!byContainer.has(container)) {
      byContainer.set(container, {
        containerType: container,
        color: containerColor(container),
        count: 1,
        panelCodes: [],
      });
    }
    byContainer.get(container).panelCodes.push(p.code);
  }
  return [...byContainer.values()];
}

/**
 * Build the empty result rows for a report from the catalogue, freezing each
 * parameter's resolved reference range onto the report.
 *
 * Includes referred-out panels too (e.g. LFT) -- they get no result rows
 * (nothing is measured in-house), just an empty `referral` slot the lab fills
 * by uploading the partner lab's own report once it comes back. That keeps
 * one accession's tests -- in-house and referred alike -- on a single report
 * so release can be gated on all of them being complete.
 */
export function buildReportPanels(panels, patient) {
  return panels.map((p) => ({
    panel: p._id,
    code: p.code,
    name: p.name,
    category: p.category || "",
    method: p.method || "",
    sampleType: p.sampleType || "",
    interpretation: p.interpretation || "",
    isInHouse: p.isInHouse,
    results: p.isInHouse
      ? (p.parameters || [])
          .slice()
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((param) => {
            const range = resolveRange(param, patient);
            return {
              parameterName: param.name,
              parameterCode: param.code || null,
              unit: param.unit || "",
              group: param.group || null,
              order: param.order || 0,
              valueType: param.valueType || "numeric",
              options: param.options || [],
              formula: param.formula || null,
              decimals: param.decimals ?? 1,
              value: null,
              refLow: range?.low ?? null,
              refHigh: range?.high ?? null,
              refDisplay: formatRange(range),
              flag: "",
            };
          })
      : [],
    referral: {
      status: p.isInHouse ? "not_applicable" : "awaiting_report",
      labName: p.isInHouse ? null : p.referralLab?.name || null,
    },
  }));
}

/**
 * Panels still blocking release: referred-out and not yet staff-verified.
 * A report with no referred panels at all returns an empty array.
 */
export function pendingReferrals(panels = []) {
  return panels.filter((p) => !p.isInHouse && p.referral?.status !== "verified");
}

/**
 * S3 storage for a referred panel's uploaded report -- one file per
 * (report, panel code), separate from `LabOrder.reportUrl` (the whole-order
 * PDF used when a booking's entire test set comes from a partner lab).
 */
export async function uploadReferralReportToS3({ reportId, code, fileBuffer, mimeType, fileName }) {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  const safeFileName = decodeURIComponent(fileName || "report").replace(/[^a-zA-Z0-9.\-]/g, "_");
  const ext = mimeType === "application/pdf" ? "pdf" : (mimeType.split("/")[1] || "jpg");
  const key = `pathology-referrals/${reportId}/${code}/${Date.now()}-${safeFileName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentDisposition: "inline",
    })
  );

  return { url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`, key };
}

export async function deleteReferralReportFromS3(key) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
  } catch (err) {
    console.error("deleteReferralReportFromS3:", err.message);
  }
}

/**
 * Recompute derived values and flags across a report after values change.
 * Mutates and returns the panels array.
 */
export function recalcReportPanels(panels) {
  for (const p of panels) {
    const byCode = {};
    for (const r of p.results) {
      if (r.parameterCode) byCode[r.parameterCode] = r.value;
    }

    for (const r of p.results) {
      if (r.valueType === "formula" && r.formula) {
        const computed = evaluateFormula(r.formula, byCode);
        if (computed !== null) {
          // Round to the precision the catalogue declares, so a derived value
          // prints as "6.9" rather than "6.857142857142857".
          const d = Number.isFinite(r.decimals) ? r.decimals : 1;
          r.value = Number(computed.toFixed(d));
        }
      }
      r.flag = computeFlag(
        r.value,
        { low: r.refLow, high: r.refHigh, display: r.refDisplay },
        r.valueType
      );
    }
  }
  return panels;
}

/**
 * Called the moment a lab order's payment clears (online verify, or COD
 * marked paid at collection). If the doctor had already final-verified the
 * report before payment came in -- release was withheld pending payment --
 * this releases it automatically. A no-op in every other case: report not
 * final-verified yet, already released, or still blocked on a referral.
 */
export async function autoReleaseOnPayment(accessionId) {
  if (!accessionId) return;

  const report = await PathologyReport.findOne({ accession: accessionId });
  if (!report || report.status !== "final_verified") return;
  if (pendingReferrals(report.panels).length) return;

  report.status = "released";
  report.sentAt = new Date();
  report.sentChannels = Array.from(new Set([...(report.sentChannels || []), "whatsapp"]));
  report.audit.push({
    action: "released",
    byName: "System",
    role: "system",
    note: "auto-released after payment received",
  });
  await report.save();

  const accession = await Accession.findByIdAndUpdate(
    accessionId,
    { status: "reported" },
    { returnDocument: "after" }
  );
  if (accession?.labOrder) {
    await LabOrder.findByIdAndUpdate(accession.labOrder, { orderStatus: "REPORT_READY" });
  }
}

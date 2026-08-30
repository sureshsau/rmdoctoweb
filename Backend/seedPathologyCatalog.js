import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import PathologyPanel from "./models/lab/pathologyPanel.model.js";

/**
 * Seeds the analyte catalogue.
 *   node seedPathologyCatalog.js
 *
 * Idempotent: upserts by `code`, so re-running refreshes ranges without
 * duplicating panels. Reference ranges follow common Indian lab practice --
 * confirm them against your own kit inserts before clinical use.
 */

const r = (low, high, sex = "any", extra = {}) => ({
  sex,
  low,
  high,
  minAgeYears: null,
  maxAgeYears: null,
  display: null,
  ...extra,
});

const PANELS = [
  /* ================= HAEMATOLOGY (IN-HOUSE) ================= */
  {
    code: "CBC",
    name: "Complete Blood Count (CBC)",
    category: "Haematology",
    sampleType: "Whole Blood",
    container: "EDTA (Lavender)",
    method: "Automated Cell Counter / Microscopy",
    isInHouse: true,
    tatHours: 6,
    interpretation:
      "Differential count performed by automated analyser with microscopic review of abnormal scattergrams.",
    parameters: [
      { name: "Haemoglobin", code: "hb", unit: "g/dL", order: 1, decimals: 1, group: "PRIMARY",
        ranges: [r(13, 17, "male"), r(12, 15, "female"), { ...r(11, 14, "any"), minAgeYears: 0, maxAgeYears: 12 }] },
      { name: "Total RBC Count", code: "rbc", unit: "mill/cmm", order: 2, decimals: 2, group: "PRIMARY",
        ranges: [r(4.5, 5.5, "male"), r(3.8, 4.8, "female")] },
      { name: "PCV / Haematocrit", code: "pcv", unit: "%", order: 3, decimals: 1, group: "PRIMARY",
        ranges: [r(40, 50, "male"), r(36, 46, "female")] },
      { name: "MCV", code: "mcv", unit: "fL", order: 4, decimals: 1, group: "RBC INDICES", ranges: [r(83, 101)] },
      { name: "MCH", code: "mch", unit: "pg", order: 5, decimals: 1, group: "RBC INDICES", ranges: [r(27, 32)] },
      { name: "MCHC", code: "mchc", unit: "g/dL", order: 6, decimals: 1, group: "RBC INDICES", ranges: [r(31.5, 34.5)] },
      { name: "RDW-CV", code: "rdw", unit: "%", order: 7, decimals: 1, group: "RBC INDICES", ranges: [r(11.6, 14)] },
      { name: "Total WBC Count", code: "tlc", unit: "/cmm", order: 8, decimals: 0, group: "WBC",
        ranges: [r(4000, 11000)] },
      { name: "Neutrophils", code: "neut", unit: "%", order: 9, decimals: 0, group: "DIFFERENTIAL COUNT", ranges: [r(40, 80)] },
      { name: "Lymphocytes", code: "lymph", unit: "%", order: 10, decimals: 0, group: "DIFFERENTIAL COUNT", ranges: [r(20, 40)] },
      { name: "Eosinophils", code: "eos", unit: "%", order: 11, decimals: 0, group: "DIFFERENTIAL COUNT", ranges: [r(1, 6)] },
      { name: "Monocytes", code: "mono", unit: "%", order: 12, decimals: 0, group: "DIFFERENTIAL COUNT", ranges: [r(2, 10)] },
      { name: "Basophils", code: "baso", unit: "%", order: 13, decimals: 0, group: "DIFFERENTIAL COUNT", ranges: [r(0, 2)] },
      { name: "Platelet Count", code: "plt", unit: "lakh/cmm", order: 14, decimals: 2, group: "PLATELETS",
        ranges: [r(1.5, 4.1)] },
      { name: "RBC Morphology", code: "rbcmorph", unit: "", order: 15, valueType: "options", group: "MORPHOLOGY",
        options: ["Normocytic Normochromic", "Microcytic Hypochromic", "Macrocytic", "Dimorphic"], ranges: [] },
    ],
  },
  {
    code: "ESR",
    name: "Erythrocyte Sedimentation Rate (ESR)",
    category: "Haematology",
    sampleType: "Whole Blood",
    container: "EDTA (Lavender)",
    method: "Westergren",
    isInHouse: true,
    tatHours: 4,
    parameters: [
      { name: "ESR (1st hour)", code: "esr", unit: "mm/hr", order: 1, decimals: 0,
        ranges: [r(0, 15, "male"), r(0, 20, "female")] },
    ],
  },
  {
    code: "BLGRP",
    name: "Blood Group & Rh Typing",
    category: "Haematology",
    sampleType: "Whole Blood",
    container: "EDTA (Lavender)",
    method: "Slide / Tube Agglutination",
    isInHouse: true,
    tatHours: 2,
    parameters: [
      { name: "ABO Group", code: "abo", unit: "", order: 1, valueType: "options",
        options: ["A", "B", "AB", "O"], ranges: [] },
      { name: "Rh (D) Factor", code: "rh", unit: "", order: 2, valueType: "options",
        options: ["Positive", "Negative"], ranges: [] },
    ],
  },

  /* ================= BIOCHEMISTRY ================= */
  {
    code: "LFT",
    name: "Liver Function Test (LFT)",
    category: "Biochemistry",
    sampleType: "Serum",
    container: "Plain / SST (Red)",
    method: "Photometric",
    // Not performed here -- dispatched to the partner lab.
    isInHouse: false,
    referralLab: { name: "Partner Reference Laboratory", contact: "" },
    tatHours: 24,
    parameters: [
      { name: "Bilirubin - Total", code: "bilt", unit: "mg/dL", order: 1, decimals: 2, ranges: [r(0.2, 1.2)] },
      { name: "Bilirubin - Direct", code: "bild", unit: "mg/dL", order: 2, decimals: 2, ranges: [r(0, 0.3)] },
      { name: "Bilirubin - Indirect", code: "bili", unit: "mg/dL", order: 3, decimals: 2,
        valueType: "formula", formula: "bilt - bild", ranges: [r(0.1, 1.0)] },
      { name: "SGOT / AST", code: "sgot", unit: "U/L", order: 4, decimals: 0, ranges: [r(5, 40)] },
      { name: "SGPT / ALT", code: "sgpt", unit: "U/L", order: 5, decimals: 0, ranges: [r(5, 45)] },
      { name: "Alkaline Phosphatase", code: "alp", unit: "U/L", order: 6, decimals: 0, ranges: [r(40, 130)] },
      { name: "Total Protein", code: "tp", unit: "g/dL", order: 7, decimals: 1, ranges: [r(6.4, 8.3)] },
      { name: "Albumin", code: "alb", unit: "g/dL", order: 8, decimals: 1, ranges: [r(3.5, 5.2)] },
      { name: "Globulin", code: "glob", unit: "g/dL", order: 9, decimals: 1,
        valueType: "formula", formula: "tp - alb", ranges: [r(2.3, 3.5)] },
      { name: "A/G Ratio", code: "agratio", unit: "", order: 10, decimals: 2,
        valueType: "formula", formula: "alb / glob", ranges: [r(1.1, 2.2)] },
    ],
  },
  {
    code: "KFT",
    name: "Kidney Function Test (KFT)",
    category: "Biochemistry",
    sampleType: "Serum",
    container: "Plain / SST (Red)",
    method: "Photometric",
    isInHouse: true,
    tatHours: 12,
    parameters: [
      { name: "Blood Urea", code: "urea", unit: "mg/dL", order: 1, decimals: 0, ranges: [r(15, 45)] },
      { name: "Serum Creatinine", code: "creat", unit: "mg/dL", order: 2, decimals: 2,
        ranges: [r(0.7, 1.3, "male"), r(0.6, 1.1, "female")] },
      { name: "Uric Acid", code: "ua", unit: "mg/dL", order: 3, decimals: 1,
        ranges: [r(3.5, 7.2, "male"), r(2.6, 6.0, "female")] },
      { name: "Sodium", code: "na", unit: "mmol/L", order: 4, decimals: 0, ranges: [r(136, 145)] },
      { name: "Potassium", code: "k", unit: "mmol/L", order: 5, decimals: 1, ranges: [r(3.5, 5.1)] },
      { name: "Chloride", code: "cl", unit: "mmol/L", order: 6, decimals: 0, ranges: [r(98, 107)] },
    ],
  },
  {
    code: "LIPID",
    name: "Lipid Profile",
    category: "Biochemistry",
    sampleType: "Serum (12 hr fasting)",
    container: "Plain / SST (Red)",
    method: "Enzymatic",
    isInHouse: true,
    tatHours: 12,
    parameters: [
      { name: "Total Cholesterol", code: "chol", unit: "mg/dL", order: 1, decimals: 0, ranges: [r(null, 200)] },
      { name: "Triglycerides", code: "tg", unit: "mg/dL", order: 2, decimals: 0, ranges: [r(null, 150)] },
      { name: "HDL Cholesterol", code: "hdl", unit: "mg/dL", order: 3, decimals: 0,
        ranges: [r(40, null, "male"), r(50, null, "female")] },
      { name: "LDL Cholesterol", code: "ldl", unit: "mg/dL", order: 4, decimals: 0,
        valueType: "formula", formula: "chol - hdl - (tg / 5)", ranges: [r(null, 100)] },
      { name: "VLDL Cholesterol", code: "vldl", unit: "mg/dL", order: 5, decimals: 0,
        valueType: "formula", formula: "tg / 5", ranges: [r(10, 30)] },
      { name: "Chol / HDL Ratio", code: "cholratio", unit: "", order: 6, decimals: 1,
        valueType: "formula", formula: "chol / hdl", ranges: [r(null, 4.5)] },
    ],
  },
  {
    code: "FBS",
    name: "Blood Sugar (Fasting & PP)",
    category: "Biochemistry",
    sampleType: "Fluoride Plasma",
    container: "Fluoride (Grey)",
    method: "GOD-POD",
    isInHouse: true,
    tatHours: 4,
    parameters: [
      { name: "Fasting Blood Sugar", code: "fbs", unit: "mg/dL", order: 1, decimals: 0, ranges: [r(70, 100)] },
      { name: "Post Prandial Blood Sugar", code: "ppbs", unit: "mg/dL", order: 2, decimals: 0, ranges: [r(70, 140)] },
    ],
  },
  {
    code: "HBA1C",
    name: "Glycosylated Haemoglobin (HbA1c)",
    category: "Biochemistry",
    sampleType: "Whole Blood",
    container: "EDTA (Lavender)",
    method: "HPLC",
    isInHouse: false,
    referralLab: { name: "Partner Reference Laboratory", contact: "" },
    tatHours: 24,
    parameters: [
      { name: "HbA1c", code: "hba1c", unit: "%", order: 1, decimals: 1, ranges: [r(4.0, 5.6)] },
      { name: "Estimated Average Glucose", code: "eag", unit: "mg/dL", order: 2, decimals: 0,
        valueType: "formula", formula: "(28.7 * hba1c) - 46.7", ranges: [] },
    ],
  },

  /* ================= HORMONES ================= */
  {
    code: "TFT",
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Hormones",
    sampleType: "Serum",
    container: "Plain / SST (Red)",
    method: "CLIA",
    isInHouse: false,
    referralLab: { name: "Partner Reference Laboratory", contact: "" },
    tatHours: 24,
    parameters: [
      { name: "Total T3", code: "t3", unit: "ng/dL", order: 1, decimals: 0, ranges: [r(80, 200)] },
      { name: "Total T4", code: "t4", unit: "ug/dL", order: 2, decimals: 1, ranges: [r(5.1, 14.1)] },
      { name: "TSH", code: "tsh", unit: "uIU/mL", order: 3, decimals: 2, ranges: [r(0.27, 4.2)] },
    ],
  },

  /* ================= SEROLOGY ================= */
  {
    code: "WIDAL",
    name: "Widal Test (Slide Agglutination)",
    category: "Serology",
    sampleType: "Serum",
    container: "Plain (Red)",
    method: "Slide Agglutination",
    isInHouse: true,
    tatHours: 6,
    parameters: [
      { name: "S. Typhi O", code: "typhio", unit: "titre", order: 1, valueType: "options",
        options: ["Non Reactive", "1:20", "1:40", "1:80", "1:160", "1:320"], ranges: [] },
      { name: "S. Typhi H", code: "typhih", unit: "titre", order: 2, valueType: "options",
        options: ["Non Reactive", "1:20", "1:40", "1:80", "1:160", "1:320"], ranges: [] },
      { name: "S. Paratyphi AH", code: "ah", unit: "titre", order: 3, valueType: "options",
        options: ["Non Reactive", "1:20", "1:40", "1:80", "1:160"], ranges: [] },
      { name: "S. Paratyphi BH", code: "bh", unit: "titre", order: 4, valueType: "options",
        options: ["Non Reactive", "1:20", "1:40", "1:80", "1:160"], ranges: [] },
    ],
  },
  {
    code: "CRP",
    name: "C-Reactive Protein (CRP)",
    category: "Serology",
    sampleType: "Serum",
    container: "Plain (Red)",
    method: "Turbidimetric",
    isInHouse: true,
    tatHours: 6,
    parameters: [
      { name: "CRP (Quantitative)", code: "crp", unit: "mg/L", order: 1, decimals: 1, ranges: [r(null, 6)] },
    ],
  },

  /* ================= CLINICAL PATHOLOGY ================= */
  {
    code: "URINE",
    name: "Urine Routine & Microscopy",
    category: "Clinical Pathology",
    sampleType: "Random Urine",
    container: "Sterile Container",
    method: "Strip / Microscopy",
    isInHouse: true,
    tatHours: 4,
    parameters: [
      { name: "Colour", code: "ucolour", unit: "", order: 1, valueType: "options", group: "PHYSICAL",
        options: ["Pale Yellow", "Yellow", "Dark Yellow", "Amber", "Reddish"], ranges: [] },
      { name: "Appearance", code: "uappear", unit: "", order: 2, valueType: "options", group: "PHYSICAL",
        options: ["Clear", "Slightly Turbid", "Turbid"], ranges: [] },
      { name: "pH", code: "uph", unit: "", order: 3, decimals: 1, group: "CHEMICAL", ranges: [r(4.6, 8.0)] },
      { name: "Specific Gravity", code: "usg", unit: "", order: 4, decimals: 3, group: "CHEMICAL",
        ranges: [r(1.005, 1.03)] },
      { name: "Protein", code: "uprot", unit: "", order: 5, valueType: "options", group: "CHEMICAL",
        options: ["Nil", "Trace", "1+", "2+", "3+", "4+"], ranges: [] },
      { name: "Glucose", code: "uglu", unit: "", order: 6, valueType: "options", group: "CHEMICAL",
        options: ["Nil", "Trace", "1+", "2+", "3+", "4+"], ranges: [] },
      { name: "Pus Cells", code: "upus", unit: "/hpf", order: 7, valueType: "text", group: "MICROSCOPY", ranges: [] },
      { name: "Epithelial Cells", code: "uepi", unit: "/hpf", order: 8, valueType: "text", group: "MICROSCOPY", ranges: [] },
      { name: "RBCs", code: "urbc", unit: "/hpf", order: 9, valueType: "text", group: "MICROSCOPY", ranges: [] },
      { name: "Crystals", code: "ucryst", unit: "", order: 10, valueType: "text", group: "MICROSCOPY", ranges: [] },
    ],
  },
];

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(uri);
  console.log("connected\n");

  let created = 0;
  let updated = 0;

  for (const p of PANELS) {
    const existing = await PathologyPanel.findOne({ code: p.code });
    await PathologyPanel.findOneAndUpdate({ code: p.code }, p, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });
    existing ? (updated += 1) : (created += 1);
    console.log(`${existing ? "updated" : "created"}  ${p.code.padEnd(7)} ${p.name}`);
  }

  const inHouse = PANELS.filter((p) => p.isInHouse).map((p) => p.code);
  const referred = PANELS.filter((p) => !p.isInHouse).map((p) => p.code);

  console.log(`\ncreated ${created}, updated ${updated}`);
  console.log(`in-house : ${inHouse.join(", ")}`);
  console.log(`referred : ${referred.join(", ")}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

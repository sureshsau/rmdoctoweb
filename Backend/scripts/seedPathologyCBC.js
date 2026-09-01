import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import PathologyPanel from "../models/lab/pathologyPanel.model.js";
import PathologyReport from "../models/lab/pathologyReport.model.js";
import Accession from "../models/lab/accession.model.js";

/**
 * One-off: wipe the throwaway pathology test data and seed a real
 * "Complete Blood Count" panel with per-parameter units, decimals and
 * sex/age reference intervals.
 *
 *   node scripts/seedPathologyCBC.js          (dry run -- shows what it would do)
 *   node scripts/seedPathologyCBC.js --apply  (write)
 *
 * Deletes every pathologypanel, accession and pathologyreport (all current
 * rows are garbage drafts), then inserts the CBC panel below. Safe to re-run.
 */

const CBC = {
  code: "CBC",
  name: "Complete Blood Count",
  category: "Haematology",
  sampleType: "Whole Blood",
  container: "EDTA",
  method: "Automated Haematology Analyzer",
  isInHouse: true,
  tatHours: 6,
  interpretation: "",
  isActive: true,
  parameters: [
    {
      name: "Hemoglobin (Hb)",
      code: "HB",
      unit: "g/dL",
      valueType: "numeric",
      decimals: 1,
      group: null,
      order: 1,
      options: [],
      formula: null,
      ranges: [
        { sex: "male", minAgeYears: 18, maxAgeYears: null, low: 13, high: 17, display: null },
        { sex: "female", minAgeYears: 18, maxAgeYears: null, low: 12, high: 15, display: null },
      ],
    },
    {
      name: "Total WBC Count",
      code: "WBC",
      unit: "/cumm",
      valueType: "numeric",
      decimals: 0,
      group: null,
      order: 2,
      options: [],
      formula: null,
      ranges: [
        { sex: "any", minAgeYears: null, maxAgeYears: null, low: 4000, high: 10000, display: null },
      ],
    },
    {
      name: "RBC Count",
      code: "RBC",
      unit: "million/cumm",
      valueType: "numeric",
      decimals: 2,
      group: null,
      order: 3,
      options: [],
      formula: null,
      ranges: [
        { sex: "male", minAgeYears: null, maxAgeYears: null, low: 4.5, high: 5.9, display: null },
        { sex: "female", minAgeYears: null, maxAgeYears: null, low: 4.1, high: 5.1, display: null },
      ],
    },
    {
      name: "Hematocrit (HCT)",
      code: "HCT",
      unit: "%",
      valueType: "numeric",
      decimals: 1,
      group: null,
      order: 4,
      options: [],
      formula: null,
      ranges: [
        { sex: "any", minAgeYears: null, maxAgeYears: null, low: 40, high: 50, display: null },
      ],
    },
  ],
};

async function run() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(uri);
  console.log(`connected  (${apply ? "APPLY" : "dry run"})\n`);

  const panels = await PathologyPanel.countDocuments();
  const accessions = await Accession.countDocuments();
  const reports = await PathologyReport.countDocuments();
  console.log(`will delete: ${panels} panel(s), ${accessions} accession(s), ${reports} report(s)`);
  console.log(`will insert panel: ${CBC.code} "${CBC.name}" with ${CBC.parameters.length} parameters`);
  for (const p of CBC.parameters) {
    console.log(`   - ${p.name} [${p.code}] ${p.unit} (${p.ranges.length} range(s))`);
  }

  if (!apply) {
    console.log("\ndry run -- nothing written. Re-run with --apply");
    await mongoose.disconnect();
    return;
  }

  await PathologyReport.deleteMany({});
  await Accession.deleteMany({});
  await PathologyPanel.deleteMany({});
  const created = await PathologyPanel.create(CBC);

  console.log(`\ndone. Panel _id ${created._id}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

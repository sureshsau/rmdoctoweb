import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import PathologyReport from "../models/lab/pathologyReport.model.js";

/**
 * One-off: migrate the pre-3-stage report statuses to the new pipeline.
 *
 *   node scripts/migratePathologyReportStatus.js          (dry run)
 *   node scripts/migratePathologyReportStatus.js --apply  (write)
 *
 * draft / rejected are unchanged. Old `verified` meant "technician verified,
 * ready to release" -- in the 3-stage flow that maps to `lab_verified`, so the
 * technician can now push it on to the doctor. Idempotent.
 */

const MAP = {
  submitted: "pending_technician",
  verified: "lab_verified",
  sent: "released",
};

async function run() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(uri);
  console.log(`connected  (${apply ? "APPLY" : "dry run"})\n`);

  let total = 0;
  for (const [from, to] of Object.entries(MAP)) {
    const count = await PathologyReport.countDocuments({ status: from });
    total += count;
    console.log(`  ${from.padEnd(18)} -> ${to.padEnd(20)} ${count} report(s)`);
    if (apply && count) {
      await PathologyReport.updateMany({ status: from }, { $set: { status: to } });
    }
  }

  console.log(`\n${apply ? "migrated" : "would migrate"} ${total} report(s)`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Role from "./models/role.model.js";
import User from "./models/user.model.js";
import { generateUserRmdId } from "./utils/rmdId.js";

/**
 * Creates the two lab roles and backfills RMD ids.
 *   node seedPathologyRoles.js
 *
 * Safe to re-run: roles upsert by key, and users that already have an rmdId
 * are skipped. Existing roles and permissions are untouched.
 */

// The "typist" role is the Data Entry Operator.
const TYPIST_PERMISSIONS = [
  "pathology.catalog.read",
  "pathology.accession.read",
  "pathology.report.read",
  "pathology.report.enter",
  "pathology.report.submit",
];

// A technician can do everything a data entry operator can, plus verify,
// send-to-doctor, return, and release.
const TECHNICIAN_PERMISSIONS = [
  ...TYPIST_PERMISSIONS,
  "pathology.catalog.manage",
  "pathology.accession.create",
  "pathology.accession.update",
  "pathology.report.verify",
  "pathology.report.send",
  "pathology.report.release",
];

// The doctor / pathologist does the final check. These are UNION-ed onto any
// existing doctor role rather than replacing it (doctors have appointment
// permissions from elsewhere).
const DOCTOR_PATHOLOGY_PERMISSIONS = [
  "pathology.catalog.read",
  "pathology.accession.read",
  "pathology.report.read",
  "pathology.report.doctor",
  "pathology.report.release",
];

const ROLES = [
  { key: "typist", name: "Lab Data Entry Operator", permissions: TYPIST_PERMISSIONS },
  { key: "lab_technician", name: "Lab Technician", permissions: TECHNICIAN_PERMISSIONS },
];

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(uri);
  console.log("connected\n");

  for (const role of ROLES) {
    const existed = await Role.findOne({ key: role.key });
    await Role.findOneAndUpdate({ key: role.key }, role, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });
    console.log(
      `${existed ? "updated" : "created"}  role ${role.key.padEnd(15)} (${role.permissions.length} permissions)`
    );
  }

  // Doctor role: union pathology perms onto whatever is already there.
  {
    const existing = await Role.findOne({ key: "doctor" });
    const merged = Array.from(
      new Set([...(existing?.permissions || []), ...DOCTOR_PATHOLOGY_PERMISSIONS])
    );
    await Role.findOneAndUpdate(
      { key: "doctor" },
      { key: "doctor", name: existing?.name || "Doctor", permissions: merged },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(
      `${existing ? "updated" : "created"}  role doctor          (${merged.length} permissions, pathology merged)`
    );
  }

  // Backfill: every existing person gets a stable RMD id.
  const pending = await User.find({ $or: [{ rmdId: { $exists: false } }, { rmdId: null }] })
    .select("_id name phone dashboard")
    .sort({ createdAt: 1 });

  console.log(`\n${pending.length} user(s) need an RMD id`);

  for (const u of pending) {
    const rmdId = await generateUserRmdId();
    await User.updateOne({ _id: u._id }, { $set: { rmdId } });
    console.log(`  ${rmdId}  ${(u.name || "-").padEnd(22)} ${u.dashboard || ""}`);
  }

  const total = await User.countDocuments();
  const withId = await User.countDocuments({ rmdId: { $ne: null, $exists: true } });
  console.log(`\n${withId}/${total} users now carry an RMD id`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

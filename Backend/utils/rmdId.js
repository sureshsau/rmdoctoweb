import Counter from "../models/counter.model.js";

/**
 * RMD identity scheme -- every human and every specimen carries one.
 *
 *   RMD<NNNNNN>            staff / patients       e.g. RMD000142
 *   RMDL<YYMMDD><NNNN>     lab accession          e.g. RMDL2608250007
 *
 * The accession count resets each day so the number stays short enough to
 * print and scan comfortably on a tube label.
 *
 * Supersedes the unused utils/generateUserId.js (random 10-digit, never wired
 * up and with no matching field on the user model).
 */

const pad = (n, width) => String(n).padStart(width, "0");

async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}

/** RMD000001 -- stable public id for any user (patient, staff, doctor). */
export async function generateUserRmdId() {
  const seq = await nextSeq("user");
  return `RMD${pad(seq, 6)}`;
}

/** RMDL2608250001 -- one per specimen intake, encoded into the barcode. */
export async function generateAccessionNo(date = new Date()) {
  const yy = pad(date.getFullYear() % 100, 2);
  const mm = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const daySeq = await nextSeq(`accession:${yy}${mm}${dd}`);
  return `RMDL${yy}${mm}${dd}${pad(daySeq, 4)}`;
}

/** Backfill helper for users created before this scheme existed. */
export async function ensureUserRmdId(user) {
  if (user.rmdId) return user.rmdId;
  user.rmdId = await generateUserRmdId();
  await user.save();
  return user.rmdId;
}

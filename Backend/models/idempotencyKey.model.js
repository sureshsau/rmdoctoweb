import mongoose from "mongoose";

/**
 * One row per (client-supplied Idempotency-Key, route) pair. A retried
 * mutating request (double-click, client timeout + retry) replays the first
 * response instead of re-applying the effect a second time.
 *
 * Rows expire on their own via the `expires` TTL index -- nothing needs to
 * clean this collection up.
 */
const IdempotencyKeySchema = new mongoose.Schema({
  key: { type: String, required: true },
  route: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: Number, default: null },
  response: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, // 24h
});

IdempotencyKeySchema.index({ key: 1, route: 1 }, { unique: true });

export default mongoose.model("IdempotencyKey", IdempotencyKeySchema);

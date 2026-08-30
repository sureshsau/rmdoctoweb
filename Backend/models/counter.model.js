import mongoose from "mongoose";

/**
 * Atomic sequence generator.
 * One document per sequence key (e.g. "user", "accession").
 * findOneAndUpdate with $inc is atomic in MongoDB, so concurrent requests
 * can never hand out the same number.
 */
const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Counter", CounterSchema);

import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema({
  companyId: { type: ObjectId, ref: "Company", required: true },

  date: { type: String, required: true }, // "2025-01-26"
  name: { type: String, required: true },

  type: {
    type: String,
    enum: ["public", "festival", "optional", "company_special"],
    default: "public"
  },

  createdBy: { type: ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Holiday", HolidaySchema);

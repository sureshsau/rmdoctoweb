import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    permissions: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Role", RoleSchema);

import mongoose, { Schema } from "mongoose";
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // OK
      index: true, // Faster search
    },

    phone: {
      type: String,
      unique: true, // OK
      sparse: true, // Allows null values without unique conflict
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    permissions: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true } // Automatically manages createdAt & updatedAt
);

// Compound index if you need search by role + status
// userSchema.index({ role: 1, status: 1 });

const USER = mongoose.model("USER", userSchema);
export default USER;

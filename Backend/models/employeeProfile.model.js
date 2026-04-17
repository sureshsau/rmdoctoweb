import mongoose from "mongoose";

const EmployeeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      default: null,
    },

    employeeCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: null,
    },

    joiningDate: {
      type: Date,
      default: null,
    },

    registeredBy: {
      type: String,
      enum: ["admin", "subadmin"],
      default: "admin",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeProfile", EmployeeProfileSchema);

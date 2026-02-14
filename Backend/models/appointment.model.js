import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    /* ========== DOCTOR ========== */
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ========== WHO BOOKED ========== */
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // receptionist / doctor / admin
      required: true,
      index: true,
    },

    /* ========== PATIENT DETAILS ========== */
    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    patientPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    patientAge: {
      type: Number,
    },

    patientGender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    /* ========== APPOINTMENT DETAILS ========== */
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

    appointmentTime: {
      type: String, // Example: "10:30 AM"
      required: true,
    },

    consultationFee: {
      type: Number,
      required: true,
    },

    symptoms: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

/* ========== INDEXES ========== */
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientPhone: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

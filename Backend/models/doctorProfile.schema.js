import mongoose from "mongoose";

const DoctorProfileSchema = new mongoose.Schema(
  {
    // Link to the User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // Multi-hospital support (your system supports multiple companies)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      
      index: true
    },

    // Core doctor data
    specialization: { type: String },
    department: { type: String, index: true },   // Cardiology, ENT, Ortho...
    qualification: { type: String },             // MBBS, MD, MS...
    registrationNumber: { type: String, index: true }, // Medical Council Reg No
    yearsOfExperience: { type: Number, default: 0 },

    // Clinic/Hospital related
    consultationFee: { type: Number, default: 0 },            // OPD Fee
    followUpFee: { type: Number, default: 0 },
    commissionPercentage: { type: Number, default: 0 },        // if revenue-sharing

    // Availability Schedule (VERY IMPORTANT)
    schedule: [
      {
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
          ],
          required: true
        },
        slots: [
          {
            startTime: String, // "10:00"
            endTime: String,   // "12:00"
            maxPatients: { type: Number, default: 20 }
          }
        ]
      }
    ],

    // Online/Telemedicine availability
    onlineConsultation: {
      enabled: { type: Boolean, default: false },
      fee: { type: Number, default: 0 }
    },

    // Doctor rating (calculated from reviews)
    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 }
    },

    // Security fields for doctor-side restrictions
    isApproved: { type: Boolean, default: false },    // Admin approves doctor
    isActive: { type: Boolean, default: true },       // Doctor account/lab active?

    // Verification (optional documents)
    documents: [
      {
        type: { type: String }, // degree, license, aadhaar, pan
        url: String,
        verified: { type: Boolean, default: false }
      }
    ],

    // 🪪 KYC
    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    kycDocuments: [{
      url: { type: String },
      documentType: { type: String }
    }],

    // Audit fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const doctorShema= mongoose.model("DoctorProfile", DoctorProfileSchema);
export default doctorShema;

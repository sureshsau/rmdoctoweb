import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  legalName: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  contactPhone: String,
  contactEmail: String,
  timezone: { type: String, default: 'Asia/Kolkata' },

  settings: {
    holidays: [Date], // company holiday list
    workingHours: { start: String, end: String }
  },

  subscription: {
    plan: String,
    validTill: Date,
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const companyModel= mongoose.model("Company", CompanySchema);

export default companyModel
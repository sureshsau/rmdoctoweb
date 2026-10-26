import mongoose from 'mongoose';

const medicalTourismSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  hospital: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  facilities: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const MedicalTourism = mongoose.model('MedicalTourism', medicalTourismSchema);

export default MedicalTourism;

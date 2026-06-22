const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  phone:   { type: String, required: true },
  phone2:  String,
  address: String,
  idType:  { type: String, enum: ['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'Other'], default: 'Aadhaar' },
  idNumber: String,
  notes:   String,
  // TODO: move to cloud storage (Vercel Blob) when customer count grows
  photo:   String
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);

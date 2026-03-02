const mongoose = require('mongoose')

const programSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  years: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  miscFee: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Program', programSchema)
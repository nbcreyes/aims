const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  units: { type: Number, required: true },
  yearLevel: { type: Number, required: true },
  term: { type: String, required: true, trim: true },
  hasLab: { type: Boolean, default: false },
  labFee: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Subject', subjectSchema)
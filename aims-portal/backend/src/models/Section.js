const mongoose = require('mongoose')

const sectionSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  yearLevel: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Section', sectionSchema)
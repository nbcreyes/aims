const mongoose = require('mongoose')

const studentRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  yearLevel: { type: Number, default: 1 },
  studentNo: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('StudentRecord', studentRecordSchema)
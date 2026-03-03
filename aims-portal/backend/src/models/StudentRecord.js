const mongoose = require('mongoose')

const studentRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentNo: { type: String, required: true, unique: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  yearLevel: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'dropped', 'on_leave'],
    default: 'active'
  },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gwa: { type: Number, default: null },
  gwaUpdatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('StudentRecord', studentRecordSchema)
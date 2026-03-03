const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSchedule', required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'dropped'],
    default: 'pending'
  },
  enrolledAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  droppedAt: { type: Date },
  remarks: { type: String, default: '' }
})

enrollmentSchema.index({ studentId: 1, scheduleId: 1 }, { unique: true })

module.exports = mongoose.model('Enrollment', enrollmentSchema)
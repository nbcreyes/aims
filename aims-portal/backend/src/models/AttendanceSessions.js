const mongoose = require('mongoose')

const attendanceSessionSchema = new mongoose.Schema({
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSchedule', required: true },
  date: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true }
  }],
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema)
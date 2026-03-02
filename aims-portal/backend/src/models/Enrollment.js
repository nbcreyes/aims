const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  yearLevel: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'dropped'],
    default: 'pending'
  },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClassSchedule' }],
  enrolledAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Enrollment', enrollmentSchema)
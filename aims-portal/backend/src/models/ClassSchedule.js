const mongoose = require('mongoose')

const classScheduleSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  timeStart: { type: String, required: true },
  timeEnd: { type: String, required: true },
  room: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('ClassSchedule', classScheduleSchema)
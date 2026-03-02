const mongoose = require('mongoose')

const termGradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSchedule', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  term: { type: String, enum: ['prelim', 'midterm', 'finals'], required: true },
  quizScores: [{
    title: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  activityScores: [{
    title: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  examScore: { type: Number, default: 0 },
  examMaxScore: { type: Number, default: 0 },
  classStanding: { type: Number, default: 0 },
  termGrade: { type: Number, default: 0 },
  cumulativeGrade: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// Compound unique index — one record per student per schedule per term
termGradeSchema.index({ studentId: 1, scheduleId: 1, term: 1 }, { unique: true })

module.exports = mongoose.model('TermGrade', termGradeSchema)
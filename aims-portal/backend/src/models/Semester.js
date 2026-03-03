const mongoose = require('mongoose')

const semesterSchema = new mongoose.Schema({
  schoolYear: { type: String, required: true, trim: true },
  term: {
    type: String,
    required: true,
    enum: ['1st Semester', '2nd Semester', 'Summer']
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// Compute lock dates based on 18-week semester divided into 3 terms of 6 weeks each
semesterSchema.virtual('lockDates').get(function () {
  if (!this.startDate) return null
  const start = new Date(this.startDate)
  const week = 7 * 24 * 60 * 60 * 1000

  return {
    prelim: new Date(start.getTime() + (6 * week) + (1 * week)),    // week 6 + 1 week grace
    midterm: new Date(start.getTime() + (12 * week) + (1 * week)),  // week 12 + 1 week grace
    finals: new Date(start.getTime() + (18 * week) + (1 * week))    // week 18 + 1 week grace
  }
})

semesterSchema.set('toJSON', { virtuals: true })
semesterSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Semester', semesterSchema)
const mongoose = require("mongoose");

const termGradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  term: { type: String, enum: ["prelim", "midterm", "finals"], required: true },
  isLocked: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },

  // Score components
  quizzes: [{ score: Number, total: Number }],
  activities: [{ score: Number, total: Number }],
  assignments: [{ score: Number, total: Number }],
  examScore: { type: Number, default: 0 },
  examTotal: { type: Number, default: 100 },

  // Computed grades
  classStanding: { type: Number, default: 0 },
  termGrade: { type: Number, default: 0 },
  cumulativeGrade: { type: Number, default: 0 },

  updatedAt: { type: Date, default: Date.now },
});

termGradeSchema.index(
  { studentId: 1, scheduleId: 1, term: 1 },
  { unique: true },
);

module.exports = mongoose.model("TermGrade", termGradeSchema);
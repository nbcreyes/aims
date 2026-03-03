const mongoose = require("mongoose");

const curriculumSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  yearLevel: { type: Number, required: true, min: 1, max: 5 },
  semester: {
    type: String,
    required: true,
    enum: ["1st Semester", "2nd Semester", "Summer"],
  },
  order: { type: Number, default: 0 }, // display order within the semester
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  corequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  isRequired: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// A subject can only appear once per program
curriculumSchema.index({ programId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model("Curriculum", curriculumSchema);
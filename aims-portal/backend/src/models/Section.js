const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  yearLevel: { type: Number, required: true, min: 1, max: 5 },
  sectionNumber: { type: Number, required: true, min: 1 },
  name: { type: String, unique: true }, // auto-generated e.g. CS11S1
  capacity: { type: Number, default: 40 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate section name before saving
sectionSchema.pre("save", async function (next) {
  if (!this.isModified("sectionNumber") && this.name) return next();

  try {
    const Program = require("./Program");
    const Semester = require("./Semester");

    const program = await Program.findById(this.programId);
    const semester = await Semester.findById(this.semesterId);

    if (!program || !semester)
      return next(new Error("Program or Semester not found"));

    // Get program code shortened to 2 chars — e.g. BSCS → CS, BSIT → IT
    const programCode = program.code
      .replace("BS", "")
      .replace("AB", "")
      .slice(0, 2)
      .toUpperCase();

    // Semester number: 1st = 1, 2nd = 2, Summer = 3
    const semMap = { "1st Semester": 1, "2nd Semester": 2, Summer: 3 };
    const semNumber = semMap[semester.term] || 1;

    // Format: {programCode}{yearLevel}{semNumber}S{sectionNumber}
    // e.g. CS11S1, IT22S2
    this.name = `${programCode}${this.yearLevel}${semNumber}S${this.sectionNumber}`;

    next();
  } catch (error) {
    next(error);
  }
});

// Unique constraint per program + semester + year + section number
sectionSchema.index(
  { programId: 1, semesterId: 1, yearLevel: 1, sectionNumber: 1 },
  { unique: true },
);

module.exports = mongoose.model("Section", sectionSchema);
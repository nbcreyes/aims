const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
  },
  name: { type: String, required: true, trim: true },
  units: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ["lecture", "lab", "both"], default: "lecture" },
  labFee: { type: Number, default: 0 },
  hasLab: { type: Boolean, default: false },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subject", subjectSchema);

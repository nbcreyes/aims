const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
  },
  college: { type: String, required: true, trim: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Department", departmentSchema);

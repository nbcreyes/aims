const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  birthdate: { type: Date },
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
  status: {
    type: String,
    enum: ["pending", "under_review", "accepted", "rejected"],
    default: "pending",
  },
  remarks: { type: String, default: "" },
  documents: [
    {
      docType: { type: String, required: true },
      fileUrl: { type: String, required: true },
      publicId: { type: String, default: "" },
    },
  ],
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Application", applicationSchema);

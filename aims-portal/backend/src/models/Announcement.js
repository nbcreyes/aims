const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  targetRole: { type: String, default: 'all' },
  targetProgramId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Announcement', announcementSchema)
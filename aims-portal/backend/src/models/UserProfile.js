const mongoose = require('mongoose')

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  birthdate: { type: Date },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('UserProfile', userProfileSchema)
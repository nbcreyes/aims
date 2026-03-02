const mongoose = require('mongoose')

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  birthdate: { type: Date },
  photo: { type: String, default: '' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
})

module.exports = mongoose.model('UserProfile', userProfileSchema)
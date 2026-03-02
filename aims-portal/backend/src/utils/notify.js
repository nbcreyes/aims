const Notification = require('../models/Notification')

const notify = async (userId, title, message) => {
  try {
    await Notification.create({ userId, title, message })
  } catch (error) {
    console.error('Notification error:', error.message)
  }
}

module.exports = { notify }
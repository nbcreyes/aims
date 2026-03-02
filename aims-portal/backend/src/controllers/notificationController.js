const Notification = require('../models/Notification')

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ status: 'success', message: 'Notifications fetched', data: notifications })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true })
    res.json({ status: 'success', message: 'Marked as read', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true })
    res.json({ status: 'success', message: 'All marked as read', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Notification deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { getMyNotifications, markRead, markAllRead, deleteNotification }
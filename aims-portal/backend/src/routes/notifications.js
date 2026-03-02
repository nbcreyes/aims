const express = require('express')
const router = express.Router()
const {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController')
const { protect } = require('../middleware/auth')

router.get('/', protect, getMyNotifications)
router.put('/read-all', protect, markAllRead)
router.put('/:id/read', protect, markRead)
router.delete('/:id', protect, deleteNotification)

module.exports = router
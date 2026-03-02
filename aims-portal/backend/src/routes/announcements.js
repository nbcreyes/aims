const express = require('express')
const router = express.Router()
const {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

// All authenticated users get filtered announcements
router.get('/', protect, getAnnouncements)

// Admin sees all
router.get('/all', protect, allowRoles('superadmin', 'registrar'), getAllAnnouncements)

router.get('/:id', protect, getAnnouncement)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createAnnouncement)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateAnnouncement)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteAnnouncement)

module.exports = router
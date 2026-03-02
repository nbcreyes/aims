const express = require('express')
const router = express.Router()
const {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getMySchedule
} = require('../controllers/scheduleController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('teacher', 'student'), getMySchedule)
router.get('/', protect, getSchedules)
router.get('/:id', protect, getSchedule)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createSchedule)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateSchedule)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteSchedule)

module.exports = router
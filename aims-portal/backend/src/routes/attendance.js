const express = require('express')
const router = express.Router()
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getStudentsForSession,
  getMyAttendance,
  getAttendanceReport
} = require('../controllers/attendanceController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('student'), getMyAttendance)
router.get('/students', protect, allowRoles('teacher', 'superadmin', 'registrar'), getStudentsForSession)
router.get('/report', protect, allowRoles('teacher', 'superadmin', 'registrar'), getAttendanceReport)
router.get('/', protect, allowRoles('teacher', 'superadmin', 'registrar'), getSessions)
router.get('/:id', protect, allowRoles('teacher', 'superadmin', 'registrar'), getSession)
router.post('/', protect, allowRoles('teacher', 'superadmin', 'registrar'), createSession)
router.put('/:id', protect, allowRoles('teacher', 'superadmin', 'registrar'), updateSession)
router.delete('/:id', protect, allowRoles('teacher', 'superadmin', 'registrar'), deleteSession)

module.exports = router
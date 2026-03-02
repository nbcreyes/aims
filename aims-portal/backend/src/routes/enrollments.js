const express = require('express')
const router = express.Router()
const {
  getEnrollments,
  getEnrollment,
  submitEnrollment,
  updateEnrollmentStatus,
  getMyEnrollment,
  getAvailableSubjects
} = require('../controllers/enrollmentController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

// Student routes
router.get('/my', protect, allowRoles('student'), getMyEnrollment)
router.get('/available-subjects', protect, allowRoles('student'), getAvailableSubjects)
router.post('/', protect, allowRoles('student'), submitEnrollment)

// Registrar/Admin routes
router.get('/', protect, allowRoles('superadmin', 'registrar'), getEnrollments)
router.get('/:id', protect, allowRoles('superadmin', 'registrar'), getEnrollment)
router.put('/:id/status', protect, allowRoles('superadmin', 'registrar'), updateEnrollmentStatus)

module.exports = router
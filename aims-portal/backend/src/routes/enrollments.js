const express = require('express')
const router = express.Router()
const {
  getEnrollments,
  getMyEnrollments,
  submitEnrollment,
  updateEnrollmentStatus,
  bulkUpdateEnrollment,
  getAvailableSubjects
} = require('../controllers/enrollmentController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/available', protect, allowRoles('student'), getAvailableSubjects)
router.get('/my', protect, allowRoles('student'), getMyEnrollments)
router.get('/', protect, allowRoles('superadmin', 'registrar'), getEnrollments)
router.post('/', protect, allowRoles('student'), submitEnrollment)
router.put('/bulk', protect, allowRoles('superadmin', 'registrar'), bulkUpdateEnrollment)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateEnrollmentStatus)

module.exports = router
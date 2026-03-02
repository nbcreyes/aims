const express = require('express')
const router = express.Router()
const {
  getStudents,
  getStudent,
  updateStudentRecord,
  updateStudentProfile,
  getMyRecord
} = require('../controllers/studentController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('student'), getMyRecord)
router.get('/', protect, allowRoles('superadmin', 'registrar'), getStudents)
router.get('/:id', protect, allowRoles('superadmin', 'registrar', 'student'), getStudent)
router.put('/:id/record', protect, allowRoles('superadmin', 'registrar'), updateStudentRecord)
router.put('/:id/profile', protect, allowRoles('superadmin', 'registrar', 'student'), updateStudentProfile)

module.exports = router
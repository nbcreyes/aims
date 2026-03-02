const express = require('express')
const router = express.Router()
const {
  getGradesBySchedule,
  getMyGrades,
  getGradesheet,
  upsertGrade,
  publishGrades,
  unpublishGrades
} = require('../controllers/gradeController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('student'), getMyGrades)
router.get('/sheet', protect, allowRoles('teacher', 'superadmin', 'registrar'), getGradesheet)
router.get('/', protect, allowRoles('teacher', 'superadmin', 'registrar'), getGradesBySchedule)
router.put('/', protect, allowRoles('teacher', 'superadmin', 'registrar'), upsertGrade)
router.post('/publish', protect, allowRoles('teacher', 'superadmin', 'registrar'), publishGrades)
router.post('/unpublish', protect, allowRoles('teacher', 'superadmin', 'registrar'), unpublishGrades)

module.exports = router
const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

const {
  getStudents,
  getStudent,
  updateStudentRecord,
  updateStudentProfile,
  getMyRecord,
  getStudentGWA,
  getSemesterGWA,
  recalculateGWA,
  computeGWAForStudent
} = require('../controllers/studentController')

const { getTranscript } = require('../controllers/gwaController')

// ─── Student List & Profile ───────────────────────────────────────────────────

router.get('/', protect, allowRoles('superadmin', 'registrar', 'teacher'), getStudents)

router.get('/me', protect, allowRoles('student'), getMyRecord)

router.get('/:studentId', protect, allowRoles('superadmin', 'registrar', 'teacher', 'student'), getStudent)

router.put('/:studentId/record', protect, allowRoles('superadmin', 'registrar'), updateStudentRecord)

router.put('/:studentId/profile', protect, allowRoles('superadmin', 'registrar', 'student'), updateStudentProfile)

// ─── GWA ─────────────────────────────────────────────────────────────────────

router.get('/:studentId/gwa', protect, allowRoles('superadmin', 'registrar', 'student'), getStudentGWA)

router.get('/:studentId/gwa/:semesterId', protect, allowRoles('superadmin', 'registrar', 'student'), getSemesterGWA)

router.post('/:studentId/gwa/recalculate', protect, allowRoles('superadmin', 'registrar'), recalculateGWA)

// ─── Transcript ───────────────────────────────────────────────────────────────

router.get('/:studentId/transcript', protect, allowRoles('superadmin', 'registrar', 'student'), getTranscript)

module.exports = router
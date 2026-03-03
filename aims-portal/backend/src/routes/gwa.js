const express = require('express')
const router = express.Router()
const { getStudentGWA, getTranscript } = require('../controllers/gwaController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/:studentId/gwa', protect, allowRoles('superadmin', 'registrar', 'student'), getStudentGWA)
router.get('/:studentId/transcript', protect, allowRoles('superadmin', 'registrar', 'student'), getTranscript)

module.exports = router
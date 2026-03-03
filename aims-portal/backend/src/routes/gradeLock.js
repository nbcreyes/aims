const express = require('express')
const router = express.Router()
const {
  lockGrades,
  unlockGrades,
  lockSemester,
  unlockSemester,
  getLockStatus
} = require('../controllers/gradeLockController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/status', protect, allowRoles('superadmin', 'registrar', 'teacher'), getLockStatus)
router.post('/lock', protect, allowRoles('superadmin', 'registrar'), lockGrades)
router.post('/unlock', protect, allowRoles('superadmin', 'registrar'), unlockGrades)
router.post('/lock-semester', protect, allowRoles('superadmin'), lockSemester)
router.post('/unlock-semester', protect, allowRoles('superadmin'), unlockSemester)

module.exports = router
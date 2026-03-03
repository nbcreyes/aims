const express = require('express')
const router = express.Router()
const {
  markEligibleForRemoval,
  recordRemovalExam,
  getRemovalList,
  getMyRemovalStatus
} = require('../controllers/removalController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('student'), getMyRemovalStatus)
router.get('/', protect, allowRoles('superadmin', 'registrar', 'teacher'), getRemovalList)
router.post('/eligible', protect, allowRoles('superadmin', 'registrar'), markEligibleForRemoval)
router.post('/record', protect, allowRoles('teacher', 'superadmin', 'registrar'), recordRemovalExam)

module.exports = router
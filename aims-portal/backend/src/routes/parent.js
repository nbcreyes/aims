const express = require('express')
const router = express.Router()
const {
  getMyChildren,
  getChildGrades,
  getChildAttendance,
  getChildFees,
  getChildEnrollment
} = require('../controllers/parentController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/children', protect, allowRoles('parent'), getMyChildren)
router.get('/children/:childId/grades', protect, allowRoles('parent'), getChildGrades)
router.get('/children/:childId/attendance', protect, allowRoles('parent'), getChildAttendance)
router.get('/children/:childId/fees', protect, allowRoles('parent'), getChildFees)
router.get('/children/:childId/enrollment', protect, allowRoles('parent'), getChildEnrollment)

module.exports = router
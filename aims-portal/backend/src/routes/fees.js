const express = require('express')
const router = express.Router()
const {
  getFees,
  getFee,
  getMyFees,
  getOverdueFees,
  setDueDate
} = require('../controllers/feeController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('student'), getMyFees)
router.get('/overdue', protect, allowRoles('superadmin', 'cashier'), getOverdueFees)
router.get('/', protect, allowRoles('superadmin', 'cashier', 'registrar'), getFees)
router.get('/:id', protect, allowRoles('superadmin', 'cashier', 'registrar', 'student'), getFee)
router.put('/:id/due-date', protect, allowRoles('superadmin', 'cashier'), setDueDate)

module.exports = router
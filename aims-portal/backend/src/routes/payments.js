const express = require('express')
const router = express.Router()
const {
  recordPayment,
  getPayments,
  getPayment
} = require('../controllers/feeController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, allowRoles('superadmin', 'cashier'), getPayments)
router.get('/:id', protect, allowRoles('superadmin', 'cashier'), getPayment)
router.post('/', protect, allowRoles('superadmin', 'cashier'), recordPayment)

module.exports = router